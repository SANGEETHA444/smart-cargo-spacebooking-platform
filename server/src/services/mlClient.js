import { env } from "../config/env.js";

async function post(path, body) {
  try {
    const res = await fetch(`${env.mlServiceUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  } catch (err) {
    console.warn(`ML service ${path} failed:`, err.message);
    return null;
  }
}

export const mlClient = {
  recommend: (payload) => post("/predict/recommend", payload),
  priceSuggest: (payload) => post("/predict/price-suggest", payload),
  forecast: (payload) => post("/predict/forecast", payload),
  lspScore: (payload) => post("/predict/lsp-score", payload),
  fraudCheck: (payload) => post("/predict/fraud-check", payload),
  cargoCheck: (payload) => post("/predict/cargo-check", payload),
  dtabRank: (payload) => post("/predict/dtab-rank", payload),
};
