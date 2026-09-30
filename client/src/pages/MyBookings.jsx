import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";

export default function MyBookings() {
  const token = useAuthStore((s) => s.token);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.myBookings(token).then(setBookings).catch(console.error);
  }, [token]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bookings</h1>
      <ul className="space-y-3">
        {bookings.map((b) => (
          <li key={b._id} className="border border-slate-800 rounded-lg p-4">
            <p className="font-medium">{b.containerId?.containerNo || b.containerId}</p>
            <p className="text-sm text-slate-400">
              {b.cargo?.cbm} CBM · ₹{b.amount} · {b.status}
            </p>
          </li>
        ))}
        {!bookings.length && <p className="text-slate-500">No bookings yet.</p>}
      </ul>
    </div>
  );
}
