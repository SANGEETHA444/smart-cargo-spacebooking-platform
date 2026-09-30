import mongoose from "mongoose";

const geoPoint = {
  name: String,
  country: String,
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
};

const containerSchema = new mongoose.Schema(
  {
    lspId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    containerNo: { type: String, required: true },
    mode: { type: String, enum: ["ROAD", "RAIL", "SEA", "AIR"], required: true },
    type: {
      type: String,
      enum: ["20FT", "40FT", "REEFER", "TRUCK", "ULD", "WAGON"],
      required: true,
    },
    origin: geoPoint,
    destination: geoPoint,
    departure: { type: Date, required: true },
    arrival: Date,
    cutoff: Date,
    capacity: { cbm: Number, kg: Number },
    booked: { cbm: { type: Number, default: 0 }, kg: { type: Number, default: 0 } },
    available: { cbm: Number, kg: Number },
    pricePerCbm: { type: Number, required: true },
    pricePerKg: { type: Number, default: 0 },
    cargoAllowed: [{ type: String, enum: ["GENERAL", "PERISHABLE", "HAZARDOUS"] }],
    status: { type: String, enum: ["OPEN", "CLOSED", "DEPARTED"], default: "OPEN" },
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

containerSchema.index({ "origin.location": "2dsphere" });
containerSchema.index({ status: 1, departure: 1 });

export const Container = mongoose.model("Container", containerSchema);
