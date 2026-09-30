import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { LspProfile } from "../models/LspProfile.js";
import { Container } from "../models/Container.js";

await connectDB(env.mongodbUri);

const adminEmail = process.env.ADMIN_EMAIL || "admin@cargoshare.local";
const adminPass = process.env.ADMIN_PASSWORD || "Admin123!";

let admin = await User.findOne({ email: adminEmail });
if (!admin) {
  admin = await User.create({
    role: "ADMIN",
    name: "Platform Admin",
    email: adminEmail,
    phone: "9999999999",
    passwordHash: await bcrypt.hash(adminPass, 10),
    isVerified: true,
  });
  console.log("Admin created:", adminEmail, adminPass);
}

let lspUser = await User.findOne({ email: "lsp.demo@cargoshare.local" });
if (!lspUser) {
  lspUser = await User.create({
    role: "LSP",
    name: "OceanLink Logistics",
    email: "lsp.demo@cargoshare.local",
    phone: "9876543210",
    passwordHash: await bcrypt.hash("Lsp123!", 10),
    isVerified: true,
    company: { name: "OceanLink Logistics Pvt Ltd", gst: "27AAAAA0000A1Z5" },
  });
  await LspProfile.create({
    userId: lspUser._id,
    modes: ["SEA", "ROAD"],
    licenceNo: "LSP-SEA-2024-001",
    gst: "27AAAAA0000A1Z5",
    pan: "AAAAA0000A",
    routes: ["Mumbai-Nhava Sheva", "Chennai-JNPT"],
    status: "APPROVED",
    dataQualityScore: 0.88,
    aiRecommendation: "APPROVE",
    rating: 4.6,
    approvedAt: new Date(),
  });
  console.log("Demo LSP: lsp.demo@cargoshare.local / Lsp123!");
}

let trader = await User.findOne({ email: "trader.demo@cargoshare.local" });
if (!trader) {
  trader = await User.create({
    role: "TRADER",
    name: "Spice Export Co",
    email: "trader.demo@cargoshare.local",
    phone: "9123456780",
    passwordHash: await bcrypt.hash("Trader123!", 10),
    isVerified: true,
    company: { businessType: "Exporter", iec: "IEC1234567" },
  });
  console.log("Demo trader: trader.demo@cargoshare.local / Trader123!");
}

const lspProfile = await LspProfile.findOne({ userId: lspUser._id });
const count = await Container.countDocuments({ lspId: lspUser._id });
if (count === 0) {
  const dep = new Date();
  dep.setDate(dep.getDate() + 7);
  await Container.create([
    {
      lspId: lspUser._id,
      containerNo: "CSLU-204891",
      mode: "SEA",
      type: "40FT",
      origin: {
        name: "Mumbai",
        location: { type: "Point", coordinates: [72.8777, 19.076] },
      },
      destination: { name: "Rotterdam", country: "Netherlands" },
      departure: dep,
      cutoff: dep,
      capacity: { cbm: 67, kg: 28000 },
      booked: { cbm: 12, kg: 4000 },
      available: { cbm: 55, kg: 24000 },
      pricePerCbm: 85,
      pricePerKg: 2.5,
      cargoAllowed: ["GENERAL", "PERISHABLE"],
      status: "OPEN",
    },
    {
      lspId: lspUser._id,
      containerNo: "TRK-MH-9921",
      mode: "ROAD",
      type: "TRUCK",
      origin: {
        name: "Pune ICD",
        location: { type: "Point", coordinates: [73.8567, 18.5204] },
      },
      destination: { name: "JNPT", country: "India" },
      departure: new Date(Date.now() + 2 * 86400000),
      capacity: { cbm: 28, kg: 12000 },
      booked: { cbm: 5, kg: 2000 },
      available: { cbm: 23, kg: 10000 },
      pricePerCbm: 120,
      pricePerKg: 4,
      cargoAllowed: ["GENERAL"],
      status: "OPEN",
    },
  ]);
  console.log("Sample containers seeded");
}

console.log("Seed complete");
process.exit(0);
