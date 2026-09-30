import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { api } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { io } from "socket.io-client";
import { API } from "../services/api";

export default function Search() {
  const token = useAuthStore((s) => s.token);
  const [filters, setFilters] = useState({
    dest: "",
    mode: "",
    cbm: "2",
    lat: "19.076",
    lng: "72.8777",
  });
  const [containers, setContainers] = useState([]);

  async function load() {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    ).toString();
    const data = await api.searchContainers(qs, token);
    setContainers(data.containers || []);
  }

  useEffect(() => {
    load().catch(console.error);
    const socket = io(API, { transports: ["websocket"] });
    socket.on("space:updated", () => load().catch(console.error));
    return () => socket.disconnect();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Discover container space</h1>
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <input className="input" placeholder="Destination" value={filters.dest} onChange={(e) => setFilters({ ...filters, dest: e.target.value })} />
        <select className="input" value={filters.mode} onChange={(e) => setFilters({ ...filters, mode: e.target.value })}>
          <option value="">All modes</option>
          <option value="SEA">Sea</option>
          <option value="ROAD">Road</option>
          <option value="RAIL">Rail</option>
          <option value="AIR">Air</option>
        </select>
        <input className="input" placeholder="Min CBM" value={filters.cbm} onChange={(e) => setFilters({ ...filters, cbm: e.target.value })} />
        <button type="button" onClick={load} className="bg-brand rounded-lg">
          Search (AI ranked)
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ul className="space-y-3">
          {containers.map((c) => (
            <li key={c._id} className="border border-slate-800 rounded-xl p-4 bg-slate-900/50">
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{c.containerNo}</p>
                  <p className="text-sm text-slate-400">
                    {c.origin?.name} → {c.destination?.name} ({c.mode})
                  </p>
                </div>
                <p className="text-brand font-bold">₹{c.pricePerCbm}/CBM</p>
              </div>
              <p className="text-sm mt-2">
                Available: {c.available?.cbm} CBM · Departs {new Date(c.departure).toLocaleDateString()}
              </p>
              <Link to={`/containers/${c._id}`} className="text-sm text-brand mt-2 inline-block">
                View & book →
              </Link>
            </li>
          ))}
          {!containers.length && <p className="text-slate-500">No containers match. Seed demo data or add as LSP.</p>}
        </ul>
        <div className="h-80 rounded-xl overflow-hidden border border-slate-800">
          <MapContainer center={[Number(filters.lat), Number(filters.lng)]} zoom={6} className="h-full w-full">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {containers.map((c) => {
              const coords = c.origin?.location?.coordinates;
              if (!coords) return null;
              return (
                <Marker key={c._id} position={[coords[1], coords[0]]}>
                  <Popup>{c.containerNo}</Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
