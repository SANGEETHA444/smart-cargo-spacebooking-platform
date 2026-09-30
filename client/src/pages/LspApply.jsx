import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function LspApply() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    companyName: "",
    modes: ["SEA"],
    licenceNo: "",
    gst: "",
    pan: "",
    routes: "Mumbai-JNPT",
  });
  const [error, setError] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const body = {
        ...form,
        modes: form.modes,
        routes: form.routes.split(",").map((s) => s.trim()),
      };
      const data = await api.applyLsp(body);
      setAuth({ token: data.token, user: data.user, lspProfile: data.lspProfile });
      navigate("/lsp/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2">LSP application</h1>
      <p className="text-slate-400 text-sm mb-6">Manual review + ML data-quality score before listing.</p>
      <form onSubmit={submit} className="grid gap-3">
        <input className="input" placeholder="Contact name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input className="input" placeholder="Company name" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
        <input className="input" placeholder="Licence no" value={form.licenceNo} onChange={(e) => setForm({ ...form, licenceNo: e.target.value })} required />
        <input className="input" placeholder="GST" value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} required />
        <input className="input" placeholder="PAN" value={form.pan} onChange={(e) => setForm({ ...form, pan: e.target.value })} required />
        <input className="input" placeholder="Routes (comma-separated)" value={form.routes} onChange={(e) => setForm({ ...form, routes: e.target.value })} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="bg-brand py-2 rounded-lg">
          Submit application
        </button>
      </form>
    </div>
  );
}
