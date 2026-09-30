import { LspProfile } from "../models/LspProfile.js";
import { User } from "../models/User.js";
import { Booking } from "../models/Booking.js";

export async function listLspApplications(req, res) {
  const profiles = await LspProfile.find()
    .populate("userId", "name email phone company")
    .sort({ createdAt: -1 });
  res.json(profiles);
}

export async function scheduleInspection(req, res) {
  const { date, notes } = req.body;
  const profile = await LspProfile.findById(req.params.id);
  if (!profile) return res.status(404).json({ message: "Application not found" });

  profile.status = "INSPECTION_SCHEDULED";
  profile.inspection = {
    ...profile.inspection?.toObject?.(),
    date: date ? new Date(date) : new Date(),
    inspectorId: req.user._id,
    notes: notes || "",
    result: "PENDING",
  };
  await profile.save();
  res.json(profile);
}

export async function lspDecision(req, res) {
  const { decision, reason } = req.body;
  const allowed = ["APPROVED", "REJECTED", "RESUBMIT"];
  if (!allowed.includes(decision)) {
    return res.status(400).json({ message: "Invalid decision" });
  }

  const profile = await LspProfile.findById(req.params.id);
  if (!profile) return res.status(404).json({ message: "Application not found" });

  profile.status = decision;
  if (decision === "APPROVED") {
    profile.approvedAt = new Date();
    profile.inspection.result = "PASS";
  } else if (decision === "REJECTED") {
    profile.rejectionReason = reason || "Did not meet requirements";
    profile.inspection.result = "FAIL";
  }

  await profile.save();
  res.json(profile);
}

export async function analytics(req, res) {
  const [users, lspPending, bookings, revenue] = await Promise.all([
    User.countDocuments(),
    LspProfile.countDocuments({ status: { $nin: ["APPROVED", "REJECTED"] } }),
    Booking.countDocuments({ status: { $in: ["CONFIRMED", "COMPLETED", "PAID"] } }),
    Booking.aggregate([
      { $match: { status: { $in: ["CONFIRMED", "COMPLETED", "PAID"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  res.json({
    users,
    lspPending,
    confirmedBookings: bookings,
    revenueInr: revenue[0]?.total || 0,
  });
}
