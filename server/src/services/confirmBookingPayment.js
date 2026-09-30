import { Booking } from "../models/Booking.js";
import { Payment } from "../models/Payment.js";

/**
 * Idempotent: confirms booking after successful Razorpay payment.
 */
export async function confirmBookingPayment({
  orderId,
  paymentId,
  signature,
  io,
  rawWebhook,
}) {
  const booking = await Booking.findOne({
    razorpayOrderId: orderId,
    status: "HELD",
  });
  if (!booking) {
    const already = await Booking.findOne({ razorpayOrderId: orderId, status: "CONFIRMED" });
    return { booking: already, created: false };
  }

  booking.status = "CONFIRMED";
  booking.paymentId = paymentId;
  await booking.save();

  await Payment.findOneAndUpdate(
    { bookingId: booking._id },
    {
      paymentId,
      status: "PAID",
      signature,
      ...(rawWebhook ? { rawWebhook } : {}),
    }
  );

  io?.emit("booking:confirmed", {
    bookingId: booking._id,
    containerId: booking.containerId,
  });

  return { booking, created: true };
}
