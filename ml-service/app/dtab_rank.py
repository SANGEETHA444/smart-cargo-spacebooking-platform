"""
DTAB-Rank (simplified): Departure-Time Aware Bayesian rank for container space.
Combines distance, price, time-to-departure urgency, LSP trust, and fill survival proxy.
"""
import math
from datetime import datetime


def _parse_departure(dep):
    if isinstance(dep, str):
        try:
            return datetime.fromisoformat(dep.replace("Z", "+00:00"))
        except ValueError:
            return datetime.utcnow()
    if isinstance(dep, datetime):
        return dep
    return datetime.utcnow()


def rank_containers_dtab(trader_lat, trader_lng, required_cbm, containers):
    now = datetime.utcnow()
    scored = []

    for c in containers:
        cid = c.get("id") or c.get("_id")
        lat = c.get("originLat") or 19.076
        lng = c.get("originLng") or 72.8777
        dist_km = _haversine(trader_lat, trader_lng, lat, lng)

        dep = _parse_departure(c.get("departure"))
        days_left = max(0.01, (dep - now).total_seconds() / 86400)
        urgency = 1.0 / (1.0 + days_left)

        price = float(c.get("pricePerCbm") or 100)
        avail = float(c.get("availableCbm") or 0)
        fit = min(1.0, avail / max(required_cbm, 0.1))

        trust = float(c.get("lspRating") or 4.0) / 5.0
        inspection_prior = float(c.get("trustPrior") or 0.7)

        # Survival proxy: probability space remains if not booked soon
        fill_pct = 1.0 - fit
        survival = math.exp(-0.5 * fill_pct * urgency)

        price_score = 1.0 / (1.0 + price / 50.0)
        dist_score = 1.0 / (1.0 + dist_km / 200.0)

        score = (
            0.25 * dist_score
            + 0.2 * price_score
            + 0.2 * urgency
            + 0.15 * trust * inspection_prior
            + 0.1 * fit
            + 0.1 * survival
        )

        scored.append(
            {
                "id": str(cid),
                "score": round(score, 4),
                "components": {
                    "distanceKm": round(dist_km, 1),
                    "daysToDeparture": round(days_left, 2),
                    "survival": round(survival, 3),
                },
            }
        )

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored


def _haversine(lat1, lon1, lat2, lon2):
    r = 6371
    p = math.pi / 180
    a = (
        0.5
        - math.cos((lat2 - lat1) * p) / 2
        + math.cos(lat1 * p) * math.cos(lat2 * p) * (1 - math.cos((lon2 - lon1) * p)) / 2
    )
    return 2 * r * math.asin(math.sqrt(a))
