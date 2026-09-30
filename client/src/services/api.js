const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function headers(token) {
  const h = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: headers(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

export const api = {
  registerTrader: (body) => request("/auth/register/trader", { method: "POST", body }),
  applyLsp: (body) => request("/auth/lsp/apply", { method: "POST", body }),
  login: (body) => request("/auth/login", { method: "POST", body }),
  searchContainers: (qs, token) => request(`/containers?${qs}`, { token }),
  getContainer: (id, token) => request(`/containers/${id}`, { token }),
  createContainer: (body, token) => request("/containers", { method: "POST", body, token }),
  updateSpace: (id, body, token) =>
    request(`/containers/${id}/space`, { method: "PATCH", body, token }),
  priceSuggest: (id, token) => request(`/containers/${id}/price-suggest`, { token }),
  getPaymentConfig: (token) => request("/payments/config", { token }),
  createBooking: (body, token) => request("/bookings", { method: "POST", body, token }),
  verifyPayment: (body, token) => request("/payments/verify", { method: "POST", body, token }),
  myBookings: (token) => request("/bookings/mine", { token }),
  cancelBooking: (id, token) => request(`/bookings/${id}/cancel`, { method: "POST", token }),
  lspApplications: (token) => request("/admin/lsp-applications", { token }),
  lspDecision: (id, body, token) =>
    request(`/admin/lsp/${id}/decision`, { method: "POST", body, token }),
  analytics: (token) => request("/admin/analytics", { token }),
  lspMe: (token) => request("/lsp/me", { token }),
  chats: (token) => request("/chats", { token }),
  createChat: (body, token) => request("/chats", { method: "POST", body, token }),
  messages: (id, token) => request(`/chats/${id}/messages`, { token }),
};

export { API };
