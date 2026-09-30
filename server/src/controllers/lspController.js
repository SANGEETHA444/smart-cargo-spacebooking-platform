import { LspProfile } from "../models/LspProfile.js";

export async function getMyLspProfile(req, res) {
  const profile = await LspProfile.findOne({ userId: req.user._id });
  if (!profile) return res.status(404).json({ message: "LSP profile not found" });
  res.json(profile);
}

export async function requireApprovedLsp(userId) {
  const profile = await LspProfile.findOne({ userId });
  return profile?.status === "APPROVED" ? profile : null;
}
