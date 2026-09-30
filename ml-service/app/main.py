from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import math
from datetime import datetime

from app.dtab_rank import rank_containers_dtab

app = FastAPI(title="CargoShare ML Service", version="1.0.0")


class RecommendRequest(BaseModel):
    containers: List[dict]
    traderLat: float = 19.076
    traderLng: float = 72.8777
    requiredCbm: float = 1.0


class DtabRequest(BaseModel):
    trader: dict
    containers: List[dict]


class PriceSuggestRequest(BaseModel):
    currentPrice: float
    fillPct: float
    daysToDeparture: float
    mode: str = "SEA"
    route: str = ""


class LspScoreRequest(BaseModel):
    modes: List[str]
    licenceNo: str
    gst: str
    pan: str
    routes: List[str] = []
    documentsCount: int = 0


class CargoCheckRequest(BaseModel):
    description: str
    category: str
    hsCode: Optional[str] = None
    cbm: float = 1
    kg: float = 100


def haversine_km(lat1, lon1, lat2, lon2):
    r = 6371
    p = math.pi / 180
    a = (
        0.5
        - math.cos((lat2 - lat1) * p) / 2
        + math.cos(lat1 * p) * math.cos(lat2 * p) * (1 - math.cos((lon2 - lon1) * p)) / 2
    )
    return 2 * r * math.asin(math.sqrt(a))


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/predict/recommend")
def recommend(req: RecommendRequest):
    ranked = rank_containers_dtab(
        req.traderLat,
        req.traderLng,
        req.requiredCbm,
        req.containers,
    )
    return {"rankedIds": [c["id"] for c in ranked], "scores": ranked}


@app.post("/predict/dtab-rank")
def dtab_rank(req: DtabRequest):
    t = req.trader
    ranked = rank_containers_dtab(
        t.get("lat", 19.076),
        t.get("lng", 72.8777),
        t.get("requiredCbm", 1),
        req.containers,
    )
    return {"rankedIds": [c["id"] for c in ranked], "items": ranked}


@app.post("/predict/price-suggest")
def price_suggest(req: PriceSuggestRequest):
    factor = 1.0
    if req.daysToDeparture < 2:
        factor = 0.85
    elif req.daysToDeparture < 5:
        factor = 0.92
    if req.fillPct < 0.3:
        factor *= 0.95
    elif req.fillPct > 0.8:
        factor *= 1.05
    suggested = max(10, round(req.currentPrice * factor, 2))
    return {
        "suggestedPricePerCbm": suggested,
        "rationale": f"Adjusted for {req.daysToDeparture:.1f} days to departure and {req.fillPct:.0%} fill",
    }


@app.post("/predict/forecast")
def forecast(payload: dict):
    route = payload.get("route", "default")
    days = payload.get("horizonDays", 14)
    base = 0.65 + 0.05 * (hash(route) % 5)
    series = [
        {"day": i + 1, "fillProbability": min(0.99, base + 0.01 * i)} for i in range(days)
    ]
    return {"route": route, "series": series}


@app.post("/predict/lsp-score")
def lsp_score(req: LspScoreRequest):
    score = 0.4
    if len(req.modes) >= 1:
        score += 0.1
    if req.licenceNo and len(req.licenceNo) >= 6:
        score += 0.15
    if req.gst and len(req.gst) >= 10:
        score += 0.15
    if req.pan and len(req.pan) >= 8:
        score += 0.1
    if len(req.routes) >= 2:
        score += 0.1
    score += min(0.1, req.documentsCount * 0.03)
    score = min(0.99, score)
    rec = "APPROVE" if score >= 0.75 else "REVIEW" if score >= 0.55 else "REJECT"
    return {"score": round(score, 3), "recommendation": rec}


@app.post("/predict/fraud-check")
def fraud_check(payload: dict):
    flags = []
    if payload.get("cancellationCount", 0) > 5:
        flags.append("high_cancellations")
    if payload.get("pricePerCbm", 0) < 5:
        flags.append("suspiciously_low_price")
    return {"riskScore": 0.8 if flags else 0.1, "flags": flags}


@app.post("/predict/cargo-check")
def cargo_check(req: CargoCheckRequest):
    text = req.description.lower()
    warning = None
    compatible = True
    if req.category == "HAZARDOUS" and any(w in text for w in ["food", "spice", "grain"]):
        compatible = False
        warning = "Hazardous cargo description conflicts with food-related terms"
    if "battery" in text and req.category != "HAZARDOUS":
        warning = "Consider classifying as hazardous (batteries detected in description)"
    return {"compatible": compatible, "warning": warning, "detectedCategory": req.category}
