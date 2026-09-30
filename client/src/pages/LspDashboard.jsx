import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function LspDashboard() {
  const token = useAuthStore((s) => s.token);
  const lspProfile = useAuthStore((s) => s.lspProfile);
  const [profile, setProfile] = useState(lspProfile);

  useEffect(() => {
    api.lspMe(token).then(setProfile).catch(console.error);
  }, [token]);

  return (
    <div>
      <h1 className="text-2xl font-bold">LSP dashboard</h1>
      <p className="text-slate-400 mt-1">Status: {profile?.status || "—"}</p>
      {profile?.status !== "APPROVED" && (
        <p className="mt-4 text-amber-400 text-sm">
          Listings are locked until admin approval. Data quality score:{" "}
          {profile?.dataQualityScore ?? "pending"}.
        </p>
      )}
      <Link to="/lsp/containers" className="inline-block mt-6 text-brand">
        Manage containers →
      </Link>
    </div>
  );
}
