import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function AdminPanel() {
  const token = useAuthStore((s) => s.token);
  const [apps, setApps] = useState([]);
  const [stats, setStats] = useState(null);

  async function refresh() {
    const [a, s] = await Promise.all([api.lspApplications(token), api.analytics(token)]);
    setApps(a);
    setStats(s);
  }

  useEffect(() => {
    refresh().catch(console.error);
  }, [token]);

  async function decide(id, decision) {
    await api.lspDecision(id, { decision }, token);
    refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin</h1>
      {stats && (
        <p className="text-slate-400 text-sm mt-2">
          Users {stats.users} · Pending LSP {stats.lspPending} · Revenue ₹{stats.revenueInr}
        </p>
      )}
      <h2 className="font-semibold mt-8 mb-3">LSP applications</h2>
      <ul className="space-y-3">
        {apps.map((p) => (
          <li key={p._id} className="border border-slate-800 rounded-lg p-4 flex justify-between gap-4">
            <div>
              <p className="font-medium">{p.userId?.company?.name || p.userId?.name}</p>
              <p className="text-xs text-slate-400">
                {p.status} · ML score {p.dataQualityScore} · {p.aiRecommendation}
              </p>
            </div>
            {p.status !== "APPROVED" && (
              <div className="flex gap-2">
                <button type="button" className="text-emerald-400 text-sm" onClick={() => decide(p._id, "APPROVED")}>
                  Approve
                </button>
                <button type="button" className="text-red-400 text-sm" onClick={() => decide(p._id, "REJECTED")}>
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
