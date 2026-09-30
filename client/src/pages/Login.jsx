import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api.login({ email, password });
      setAuth({ token: data.token, user: data.user, lspProfile: data.lspProfile });
      if (data.user.role === "ADMIN") navigate("/admin");
      else if (data.user.role === "LSP") navigate("/lsp/dashboard");
      else navigate("/search");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>
      <form onSubmit={submit} className="space-y-4">
        <input
          className="input"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" className="w-full bg-brand py-2 rounded-lg font-medium">
          Login
        </button>
      </form>
      <p className="text-sm text-slate-400 mt-4">
        Demo: trader.demo@cargoshare.local / Trader123! (run <code className="text-xs">npm run seed</code> in{" "}
        server). Payments use Razorpay test keys in server <code className="text-xs">.env</code>.
      </p>
      <p className="text-sm mt-2">
        <Link to="/register/trader" className="text-brand">
          Create trader account
        </Link>
      </p>
    </div>
  );
}
