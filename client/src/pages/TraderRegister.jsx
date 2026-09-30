import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function TraderRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    businessType: "Exporter",
  });
  const [error, setError] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    try {
      const data = await api.registerTrader(form);
      setAuth({ token: data.token, user: data.user, lspProfile: null });
      navigate("/search");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Trader registration</h1>
      <form onSubmit={submit} className="grid gap-3">
        {["name", "email", "phone", "password", "businessType"].map((k) => (
          <input
            key={k}
            className="input"
            type={k === "password" ? "password" : k === "email" ? "email" : "text"}
            placeholder={k}
            value={form[k]}
            onChange={(e) => set(k, e.target.value)}
            required={k !== "businessType"}
          />
        ))}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="bg-brand py-2 rounded-lg">
          Register
        </button>
      </form>
    </div>
  );
}
