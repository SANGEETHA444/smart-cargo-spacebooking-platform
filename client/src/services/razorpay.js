const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Razorpay));
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

/**
 * Opens Razorpay Checkout (test or live per key_id from server).
 * @returns {Promise<object>} Razorpay success payload
 */
export async function openRazorpayCheckout({
  keyId,
  orderId,
  amountPaise,
  currency = "INR",
  name = "CargoShare",
  description,
  prefill,
}) {
  const Razorpay = await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount: amountPaise,
      currency,
      name,
      description: description || "Container space booking",
      order_id: orderId,
      prefill: prefill || {},
      theme: { color: "#0ea5e9" },
      handler(response) {
        resolve(response);
      },
      modal: {
        ondismiss() {
          reject(new Error("Payment cancelled"));
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", (response) => {
      reject(new Error(response.error?.description || "Payment failed"));
    });
    rzp.open();
  });
}
