import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";

let razorpay = null;

export function isRazorpayEnabled() {
  return Boolean(
    env.razorpayEnabled && env.razorpayKeyId && env.razorpayKeySecret
  );
}

if (isRazorpayEnabled()) {
  if (env.nodeEnv !== "production" && !env.razorpayKeyId.startsWith("rzp_test_")) {
    console.warn(
      "[Razorpay] Use test keys (rzp_test_*) in development. Live keys are for production only."
    );
  }
  razorpay = new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
  console.log(
    `[Razorpay] ${env.razorpayKeyId.startsWith("rzp_test_") ? "Test" : "Live"} mode enabled`
  );
} else {
  console.log("[Payments] Dev mode — Razorpay disabled (set RAZORPAY_ENABLED=true to enable)");
}

export function getRazorpayKeyId() {
  return env.razorpayKeyId || null;
}

export async function createPaymentOrder(amountInr, receipt) {
  const amountPaise = Math.round(amountInr * 100);
  if (!razorpay) {
    return {
      mock: true,
      id: `order_mock_${Date.now()}`,
      amount: amountPaise,
      currency: "INR",
    };
  }
  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: receipt.slice(0, 40),
    payment_capture: 1,
  });
  return { ...order, mock: false };
}

export function verifyPaymentSignature(orderId, paymentId, signature) {
  if (!isRazorpayEnabled()) return true;
  if (!orderId || !paymentId || !signature) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", env.razorpayKeySecret)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export function verifyWebhookSignature(rawBody, signature) {
  if (!env.razorpayWebhookSecret) return true;
  if (!signature) return false;
  const expected = crypto
    .createHmac("sha256", env.razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}
