import { useState } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

const empty = {
  containerNo: "",
  mode: "SEA",
  type: "40FT",
  originName: "Mumbai",
  originLng: 72.8777,
  originLat: 19.076,
  destName: "Rotterdam",
  destCountry: "Netherlands",
  departure: "",
  capacityCbm: 60,
  capacityKg: 25000,
  pricePerCbm: 90,
};

export default function LspContainers() {
  const token = useAuthStore((s) => s.token);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.createContainer(
        { ...form, departure: new Date(form.departure || Date.now() + 86400000 * 5) },
        token
      );
      setMessage("Container published.");
      setForm(empty);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-4">Add container</h1>
      <form onSubmit={submit} className="grid gap-2">
        {Object.entries(form).map(([k, v]) => (
          <input
            key={k}
            className="input"
            placeholder={k}
            value={v}
            onChange={(e) =>
              setForm({
                ...form,
                [k]: ["originLng", "originLat", "capacityCbm", "capacityKg", "pricePerCbm"].includes(k)
                  ? Number(e.target.value)
                  : e.target.value,
              })
            }
          />
        ))}
        <button type="submit" className="bg-brand py-2 rounded-lg mt-2">
          Publish
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
    </div>
  );
}
