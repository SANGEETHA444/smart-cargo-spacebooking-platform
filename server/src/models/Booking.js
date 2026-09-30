import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    traderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    containerId: { type: mongoose.Schema.Types.ObjectId, ref: "Container", required: true },
    lspId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cargo: {
      desc: String,
      cbm: Number,
      kg: Number,
      category: { type: String, enum: ["GENERAL", "PERISHABLE", "HAZARDOUS"] },
      hsCode: String,
    },
    amount: Number,
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["HELD", "PAID", "CONFIRMED", "CANCELLED", "REFUNDED", "COMPLETED"],
      default: "HELD",
    },
    holdExpiresAt: Date,
    paymentId: String,
    razorpayOrderId: String,
    invoiceUrl: String,
  },
  { timestamps: true }
);

bookingSchema.index({ traderId: 1 });
bookingSchema.index({ holdExpiresAt: 1, status: 1 });

export const Booking = mongoose.model("Booking", bookingSchema);
