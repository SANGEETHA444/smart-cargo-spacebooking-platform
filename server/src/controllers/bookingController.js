import Joi from "joi";
import { Booking } from "../models/Booking.js";
import { Container } from "../models/Container.js";
import { Payment } from "../models/Payment.js";
import {
  createPaymentOrder,
  verifyPaymentSignature,
  isRazorpayEnabled,
  getRazorpayKeyId,
} from "../services/paymentService.js";
import { confirmBookingPayment } from "../services/confirmBookingPayment.js";
import { mlClient } from "../services/mlClient.js";

const HOLD_MINUTES = 15;

async function restoreContainerSpace(containerId, cargo) {
  await Container.findByIdAndUpdate(containerId, {
    $inc: {
      "available.cbm": cargo.cbm,
      "available.kg": cargo.kg,
      "booked.cbm": -cargo.cbm,
      "booked.kg": -cargo.kg,
    },
  });
}

const bookSchema = Joi.object({
  containerId: Joi.string().required(),
  cargo: Joi.object({
    desc: Joi.string().required(),
    cbm: Joi.number().positive().required(),
    kg: Joi.number().positive().required(),
    category: Joi.string().valid("GENERAL", "PERISHABLE", "HAZARDOUS").required(),
    hsCode: Joi.string().allow("", null).optional(),
  }).required(),
});

export async function createBooking(req, res) {
  const { error, value } = bookSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const cargoCheck = await mlClient.cargoCheck({
    description: value.cargo.desc,
    category: value.cargo.category,
    hsCode: value.cargo.hsCode,
    cbm: value.cargo.cbm,
    kg: value.cargo.kg,
  });
  if (cargoCheck && !cargoCheck.compatible) {
    return res.status(400).json({ message: cargoCheck.warning || "Cargo incompatible" });
  }

  const container = await Container.findOneAndUpdate(
    {
      _id: value.containerId,
      status: "OPEN",
      "available.cbm": { $gte: value.cargo.cbm },
      "available.kg": { $gte: value.cargo.kg },
    },
    {
      $inc: {
        "available.cbm": -value.cargo.cbm,
        "available.kg": -value.cargo.kg,
        "booked.cbm": value.cargo.cbm,
        "booked.kg": value.cargo.kg,
        version: 1,
      },
    },
    { new: true }
  );

  if (!container) {
    return res.status(409).json({ message: "Insufficient space or container unavailable" });
  }

  const amount =
    value.cargo.cbm * container.pricePerCbm + value.cargo.kg * (container.pricePerKg || 0);
  const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000);

  let booking;
  try {
    booking = await Booking.create({
      traderId: req.user._id,
      containerId: container._id,
      lspId: container.lspId,
      cargo: value.cargo,
      amount: Math.round(amount * 100) / 100,
      status: "HELD",
      holdExpiresAt,
    });

    const order = await createPaymentOrder(amount, `booking_${booking._id}`);
    booking.razorpayOrderId = order.id;
    await booking.save();

    await Payment.create({
      bookingId: booking._id,
      orderId: order.id,
      amount,
      status: "CREATED",
    });

    const io = req.app.get("io");
    io?.emit("space:updated", { containerId: container._id });

    res.status(201).json({
      booking,
      payment: {
        orderId: order.id,
        amount,
        amountPaise: order.amount,
        currency: "INR",
        keyId: isRazorpayEnabled() ? getRazorpayKeyId() : null,
        mock: !isRazorpayEnabled() || !!order.mock,
        testMode: isRazorpayEnabled() && String(getRazorpayKeyId()).startsWith("rzp_test_"),
      },
    });
  } catch (e) {
    await restoreContainerSpace(container._id, value.cargo);
    if (booking?._id) await Booking.findByIdAndDelete(booking._id);
    throw e;
  }
}

export async function verifyPayment(req, res) {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const booking = await Booking.findOne({ _id: bookingId, traderId: req.user._id });
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  if (booking.status === "CONFIRMED") {
    return res.json({
      booking,
      invoiceUrl: `/api/bookings/${booking._id}/invoice`,
    });
  }

  const orderId = razorpay_order_id || booking.razorpayOrderId;
  let paymentId = razorpay_payment_id;
  let signature = razorpay_signature;

  if (isRazorpayEnabled()) {
    if (!paymentId || !signature) {
      return res.status(400).json({ message: "Complete Razorpay payment response required" });
    }
  } else {
    paymentId = paymentId || `pay_dev_${booking._id}`;
    signature = signature || "dev_mock";
  }

  const valid = verifyPaymentSignature(orderId, paymentId, signature);
  if (!valid) return res.status(400).json({ message: "Invalid payment signature" });

  const io = req.app.get("io");
  const { booking: confirmed } = await confirmBookingPayment({
    orderId,
    paymentId,
    signature,
    io,
  });

  if (!confirmed) {
    return res.status(404).json({ message: "Booking not found for order" });
  }

  res.json({
    booking: confirmed,
    invoiceUrl: `/api/bookings/${confirmed._id}/invoice`,
  });
}

export async function paymentWebhook(req, res) {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody =
    req.body instanceof Buffer ? req.body : Buffer.from(JSON.stringify(req.body || {}));

  const { verifyWebhookSignature, isRazorpayEnabled: rpEnabled } = await import(
    "../services/paymentService.js"
  );

  if (rpEnabled() && !verifyWebhookSignature(rawBody, signature)) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return res.status(400).json({ message: "Invalid JSON" });
  }

  const io = req.app.get("io");

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    if (payment?.order_id && payment?.id) {
      await confirmBookingPayment({
        orderId: payment.order_id,
        paymentId: payment.id,
        signature: null,
        io,
        rawWebhook: event,
      });
    }
  }

  res.json({ received: true });
}

export async function cancelBooking(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Not found" });

  const isOwner = String(booking.traderId) === String(req.user._id);
  const isLsp = String(booking.lspId) === String(req.user._id);
  if (!isOwner && !isLsp && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (["CANCELLED", "REFUNDED", "COMPLETED"].includes(booking.status)) {
    return res.status(400).json({ message: "Cannot cancel" });
  }

  booking.status = "CANCELLED";
  await booking.save();

  await restoreContainerSpace(booking.containerId, booking.cargo);

  const io = req.app.get("io");
  io?.emit("space:updated", { containerId: booking.containerId });
  res.json(booking);
}

export async function myBookings(req, res) {
  const filter =
    req.user.role === "LSP"
      ? { lspId: req.user._id }
      : req.user.role === "TRADER"
        ? { traderId: req.user._id }
        : {};

  const bookings = await Booking.find(filter)
    .populate("containerId")
    .populate("traderId", "name email")
    .sort({ createdAt: -1 });
  res.json(bookings);
}

export async function getInvoice(req, res) {
  const booking = await Booking.findById(req.params.id).populate("containerId");
  if (!booking) return res.status(404).json({ message: "Not found" });
  res.json({
    invoiceId: booking._id,
    amount: booking.amount,
    currency: booking.currency,
    cargo: booking.cargo,
    container: booking.containerId,
    status: booking.status,
    createdAt: booking.createdAt,
  });
}
