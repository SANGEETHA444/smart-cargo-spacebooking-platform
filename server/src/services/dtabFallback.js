export function rankContainersFallback(traderLat, traderLng, requiredCbm, containers) {
  const now = Date.now();
  return [...containers]
    .map((c) => {
      const coords = c.origin?.location?.coordinates || [traderLng, traderLat];
      const dist = Math.hypot(coords[0] - traderLng, coords[1] - traderLat) * 111;
      const daysLeft = Math.max(0.01, (new Date(c.departure) - now) / 86400000);
      const price = c.pricePerCbm || 100;
      const avail = c.available?.cbm || 0;
      const score =
        1 / (1 + dist / 200) +
        1 / (1 + price / 50) +
        1 / (1 + daysLeft) +
        Math.min(1, avail / Math.max(requiredCbm, 0.1));
      return { id: String(c._id), score };
    })
    .sort((a, b) => b.score - a.score);
}
