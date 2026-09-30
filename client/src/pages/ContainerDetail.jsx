import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { openRazorpayCheckout } from "../services/razorpay";

export default function ContainerDetail() {
  const { id } = useParams();
  const { token, user } = useAuthStore();
  const [container, setContainer] = useState(null);
  const [payConfig, setPayConfig] = useState({ enabled: false, mode: "mock" });
  const [paying, setPaying] = useState(false);
  const [cargo, setCargo] = useState({
    desc: "General merchandise",
    cbm: 2,
    kg: 500,
    category: "GENERAL",
    hsCode: "",
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.getContainer(id, token).then(setContainer).catch(console.error);
    api
      .getPaymentConfig(token)
      .then(setPayConfig)
      .catch(() => setPayConfig({ enabled: false, mode: "mock" }));
  }, [id, token]);

  async function confirmDevPayment(booking, payment) {
    const result = await api.verifyPayment(
      {
        bookingId: booking._id,
        razorpay_order_id: payment.orderId,
        razorpay_payment_id: `pay_dev_${booking._id}`,
        razorpay_signature: "dev_mock",
      },
      token
    );
    setMsg(
      `Booking confirmed (dev — no Razorpay). Amount ₹${result.booking?.amount ?? booking.amount}.`
    );
  }

  async function book() {
    setMsg("");
    setError("");
    setPaying(true);
    try {
      const cargoPayload = { ...cargo };
      if (!cargoPayload.hsCode?.trim()) delete cargoPayload.hsCode;
      const { booking, payment } = await api.createBooking(
        { containerId: id, cargo: cargoPayload },
        token
      );

      if (user.role !== "TRADER") return;

      const useRazorpay = payConfig.enabled && payment.keyId && !payment.mock;

      if (!useRazorpay) {
        await confirmDevPayment(booking, payment);
        return;
      }

      const rpResponse = await openRazorpayCheckout({
        keyId: payment.keyId,
        orderId: payment.orderId,
        amountPaise: payment.amountPaise,
        currency: payment.currency,
        description: `Booking ${booking._id} · ${container?.containerNo || "container"}`,
        prefill: {
          name: user.name,
          email: user.email,
        },
      });

      const result = await api.verifyPayment(
        {
          bookingId: booking._id,
          razorpay_order_id: rpResponse.razorpay_order_id,
          razorpay_payment_id: rpResponse.razorpay_payment_id,
          razorpay_signature: rpResponse.razorpay_signature,
        },
        token
      );

      setMsg(
        `Booking confirmed via Razorpay test. Amount ₹${result.booking?.amount ?? booking.amount}.`
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setPaying(false);
    }
  }

  if (!container) return <p>Loading…</p>;

  const razorpayOn = payConfig.enabled && payConfig.mode !== "mock";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">{container.containerNo}</h1>
      <p className="text-slate-400">
        {container.origin?.name} → {container.destination?.name} · {container.mode} {container.type}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
          Available {container.available?.cbm} CBM / {container.available?.kg} kg
        </div>
        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
          ₹{container.pricePerCbm}/CBM · departs {new Date(container.departure).toLocaleString()}
        </div>
      </div>

      {user?.role === "TRADER" && (
        <div className="mt-8 space-y-3">
          <h2 className="font-semibold">Book space</h2>
          {!razorpayOn && (
            <p className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
              Payments run in dev mode (Razorpay off). Set <code className="text-brand">RAZORPAY_ENABLED=true</code>{" "}
              in server <code className="text-brand">.env</code> when you want real checkout.
            </p>
          )}
          {razorpayOn && payConfig.mode === "test" && (
            <p className="text-xs text-amber-400/90 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
              Razorpay test — card 4111 1111 1111 1111 or UPI success@razorpay.
            </p>
          )}
          <textarea
            className="input min-h-[80px]"
            value={cargo.desc}
            onChange={(e) => setCargo({ ...cargo, desc: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="input"
              type="number"
              value={cargo.cbm}
              onChange={(e) => setCargo({ ...cargo, cbm: Number(e.target.value) })}
            />
            <input
              className="input"
              type="number"
              value={cargo.kg}
              onChange={(e) => setCargo({ ...cargo, kg: Number(e.target.value) })}
            />
          </div>
          <select
            className="input"
            value={cargo.category}
            onChange={(e) => setCargo({ ...cargo, category: e.target.value })}
          >
            <option value="GENERAL">General</option>
            <option value="PERISHABLE">Perishable</option>
            <option value="HAZARDOUS">Hazardous</option>
          </select>
          <button
            type="button"
            onClick={book}
            disabled={paying}
            className="bg-brand px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {paying ? "Processing…" : razorpayOn ? "Book & pay" : "Book & confirm"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {msg && <p className="text-sm text-emerald-400">{msg}</p>}
        </div>
      )}
    </div>
  );
}
