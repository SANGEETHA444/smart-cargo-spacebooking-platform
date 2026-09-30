import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    gateway: { type: String, default: "RAZORPAY" },
    orderId: String,
    paymentId: String,
    signature: String,
    amount: Number,
    status: { type: String, enum: ["CREATED", "PAID", "FAILED", "REFUNDED"], default: "CREATED" },
    refundId: String,
    rawWebhook: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Payment = mongoose.model("Payment", paymentSchema);
