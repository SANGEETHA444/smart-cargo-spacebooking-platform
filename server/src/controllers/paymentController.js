import { getRazorpayKeyId, isRazorpayEnabled } from "../services/paymentService.js";

function keyMode(keyId) {
  if (!keyId) return "mock";
  return keyId.startsWith("rzp_test_") ? "test" : "live";
}

export function getPaymentConfig(_req, res) {
  const keyId = getRazorpayKeyId();
  res.json({
    enabled: isRazorpayEnabled(),
    keyId,
    mode: isRazorpayEnabled() ? keyMode(keyId) : "mock",
  });
}
