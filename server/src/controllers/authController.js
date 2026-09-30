import bcrypt from "bcryptjs";
import Joi from "joi";
import { User } from "../models/User.js";
import { LspProfile } from "../models/LspProfile.js";
import { signAccessToken } from "../middleware/auth.js";
import { mlClient } from "../services/mlClient.js";

const traderSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  password: Joi.string().min(6).required(),
  businessType: Joi.string().optional(),
  gst: Joi.string().optional(),
  iec: Joi.string().optional(),
  otp: Joi.string().length(6).optional(),
});

const lspSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
  password: Joi.string().min(6).required(),
  companyName: Joi.string().required(),
  modes: Joi.array().items(Joi.string()).min(1).required(),
  licenceNo: Joi.string().required(),
  gst: Joi.string().required(),
  pan: Joi.string().required(),
  routes: Joi.array().items(Joi.string()).default([]),
});

export async function registerTrader(req, res) {
  const { error, value } = traderSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const exists = await User.findOne({ email: value.email });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(value.password, 10);
  const user = await User.create({
    role: "TRADER",
    name: value.name,
    email: value.email,
    phone: value.phone,
    passwordHash,
    isVerified: true,
    company: {
      businessType: value.businessType,
      gst: value.gst,
      iec: value.iec,
    },
  });

  const token = signAccessToken(user._id);
  res.status(201).json({
    token,
    user: { id: user._id, role: user.role, name: user.name, email: user.email },
  });
}

export async function applyLsp(req, res) {
  const { error, value } = lspSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const exists = await User.findOne({ email: value.email });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(value.password, 10);
  const user = await User.create({
    role: "LSP",
    name: value.name,
    email: value.email,
    phone: value.phone,
    passwordHash,
    isVerified: true,
    company: { name: value.companyName, gst: value.gst },
  });

  const mlResult = await mlClient.lspScore({
    modes: value.modes,
    licenceNo: value.licenceNo,
    gst: value.gst,
    pan: value.pan,
    routes: value.routes,
    documentsCount: 0,
  });

  const profile = await LspProfile.create({
    userId: user._id,
    modes: value.modes,
    licenceNo: value.licenceNo,
    gst: value.gst,
    pan: value.pan,
    routes: value.routes,
    status: "UNDER_REVIEW",
    dataQualityScore: mlResult?.score ?? 0.65,
    aiRecommendation: mlResult?.recommendation ?? "REVIEW",
  });

  const token = signAccessToken(user._id);
  res.status(201).json({
    token,
    user: { id: user._id, role: user.role, name: user.name, email: user.email },
    lspProfile: { status: profile.status, dataQualityScore: profile.dataQualityScore },
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  let lspProfile = null;
  if (user.role === "LSP") {
    lspProfile = await LspProfile.findOne({ userId: user._id });
  }

  const token = signAccessToken(user._id);
  res.json({
    token,
    user: { id: user._id, role: user.role, name: user.name, email: user.email },
    lspProfile: lspProfile
      ? { status: lspProfile.status, dataQualityScore: lspProfile.dataQualityScore }
      : null,
  });
}

export async function verifyOtp(req, res) {
  res.json({ verified: true, message: "OTP verified (dev mode)" });
}
