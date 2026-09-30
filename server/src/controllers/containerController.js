import Joi from "joi";
import { Container } from "../models/Container.js";
import { LspProfile } from "../models/LspProfile.js";
import { mlClient } from "../services/mlClient.js";
import { rankContainersFallback } from "../services/dtabFallback.js";

const createSchema = Joi.object({
  containerNo: Joi.string().required(),
  mode: Joi.string().valid("ROAD", "RAIL", "SEA", "AIR").required(),
  type: Joi.string().valid("20FT", "40FT", "REEFER", "TRUCK", "ULD", "WAGON").required(),
  originName: Joi.string().required(),
  originLng: Joi.number().required(),
  originLat: Joi.number().required(),
  destName: Joi.string().required(),
  destCountry: Joi.string().required(),
  departure: Joi.date().required(),
  arrival: Joi.date().optional(),
  cutoff: Joi.date().optional(),
  capacityCbm: Joi.number().positive().required(),
  capacityKg: Joi.number().positive().required(),
  pricePerCbm: Joi.number().positive().required(),
  pricePerKg: Joi.number().optional(),
  cargoAllowed: Joi.array()
    .items(Joi.string().valid("GENERAL", "PERISHABLE", "HAZARDOUS"))
    .default(["GENERAL"]),
});

export async function createContainer(req, res) {
  const profile = await LspProfile.findOne({ userId: req.user._id });
  if (!profile || profile.status !== "APPROVED") {
    return res.status(403).json({ message: "Approved LSP required to publish listings" });
  }

  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const container = await Container.create({
    lspId: req.user._id,
    containerNo: value.containerNo,
    mode: value.mode,
    type: value.type,
    origin: {
      name: value.originName,
      location: { type: "Point", coordinates: [value.originLng, value.originLat] },
    },
    destination: { name: value.destName, country: value.destCountry },
    departure: value.departure,
    arrival: value.arrival,
    cutoff: value.cutoff,
    capacity: { cbm: value.capacityCbm, kg: value.capacityKg },
    booked: { cbm: 0, kg: 0 },
    available: { cbm: value.capacityCbm, kg: value.capacityKg },
    pricePerCbm: value.pricePerCbm,
    pricePerKg: value.pricePerKg || 0,
    cargoAllowed: value.cargoAllowed,
    status: "OPEN",
  });

  const io = req.app.get("io");
  io?.emit("space:updated", { containerId: container._id });

  res.status(201).json(container);
}

export async function updateSpace(req, res) {
  const profile = await LspProfile.findOne({ userId: req.user._id });
  if (!profile || profile.status !== "APPROVED") {
    return res.status(403).json({ message: "Approved LSP required" });
  }

  const container = await Container.findOne({ _id: req.params.id, lspId: req.user._id });
  if (!container) return res.status(404).json({ message: "Container not found" });

  const { availableCbm, availableKg, status, pricePerCbm } = req.body;
  if (availableCbm != null) container.available.cbm = availableCbm;
  if (availableKg != null) container.available.kg = availableKg;
  if (status) container.status = status;
  if (pricePerCbm != null) container.pricePerCbm = pricePerCbm;
  container.version += 1;
  await container.save();

  const io = req.app.get("io");
  io?.emit("space:updated", { containerId: container._id, container });

  res.json(container);
}

export async function getContainer(req, res) {
  const container = await Container.findById(req.params.id).populate("lspId", "name company rating");
  if (!container) return res.status(404).json({ message: "Not found" });
  res.json(container);
}

export async function searchContainers(req, res) {
  const {
    origin,
    dest,
    mode,
    cbm,
    kg,
    lat,
    lng,
    radius = 500000,
    cargoType,
  } = req.query;

  const filter = { status: "OPEN", departure: { $gte: new Date() } };
  if (mode) filter.mode = mode;
  if (dest) filter["destination.name"] = new RegExp(dest, "i");
  if (origin) filter["origin.name"] = new RegExp(origin, "i");
  if (cargoType) filter.cargoAllowed = cargoType;
  if (cbm) filter["available.cbm"] = { $gte: Number(cbm) };
  if (kg) filter["available.kg"] = { $gte: Number(kg) };

  let query = Container.find(filter).populate("lspId", "name").limit(100);

  if (lat && lng) {
    query = Container.find({
      ...filter,
      "origin.location": {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius),
        },
      },
    })
      .populate("lspId", "name")
      .limit(100);
  }

  let containers = await query.lean();

  const traderLat = lat ? Number(lat) : 19.076;
  const traderLng = lng ? Number(lng) : 72.8777;
  const requiredCbm = cbm ? Number(cbm) : 1;

  const ranked = await mlClient.dtabRank({
    trader: { lat: traderLat, lng: traderLng, requiredCbm },
    containers: containers.map((c) => ({
      id: String(c._id),
      pricePerCbm: c.pricePerCbm,
      availableCbm: c.available?.cbm,
      departure: c.departure,
      lspRating: 4.2,
      originLat: c.origin?.location?.coordinates?.[1],
      originLng: c.origin?.location?.coordinates?.[0],
      mode: c.mode,
    })),
  });

  const rankedIds =
    ranked?.rankedIds ||
    rankContainersFallback(traderLat, traderLng, requiredCbm, containers).map((x) => x.id);
  if (rankedIds.length) {
    const order = new Map(rankedIds.map((id, i) => [id, i]));
    containers.sort((a, b) => (order.get(String(a._id)) ?? 999) - (order.get(String(b._id)) ?? 999));
  }

  res.json({ containers, ranking: ranked });
}

export async function priceSuggestion(req, res) {
  const container = await Container.findOne({ _id: req.params.id, lspId: req.user._id });
  if (!container) return res.status(404).json({ message: "Container not found" });

  const fillPct =
    container.capacity.cbm > 0
      ? 1 - container.available.cbm / container.capacity.cbm
      : 0;
  const daysToDeparture = Math.max(
    0,
    (new Date(container.departure) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const suggestion = await mlClient.priceSuggest({
    currentPrice: container.pricePerCbm,
    fillPct,
    daysToDeparture,
    mode: container.mode,
    route: `${container.origin?.name}-${container.destination?.name}`,
  });

  res.json(
    suggestion || {
      suggestedPricePerCbm: Math.round(container.pricePerCbm * (daysToDeparture < 3 ? 0.9 : 1)),
      rationale: "Rule fallback: lower price when departure is near",
    }
  );
}
