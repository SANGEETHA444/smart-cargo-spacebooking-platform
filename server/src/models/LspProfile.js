import mongoose from "mongoose";

const lspProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    modes: [{ type: String, enum: ["ROAD", "RAIL", "SEA", "AIR"] }],
    licenceNo: String,
    gst: String,
    pan: String,
    documents: [{ type: String, url: String, ocrData: mongoose.Schema.Types.Mixed }],
    routes: [String],
    status: {
      type: String,
      enum: [
        "APPLIED",
        "UNDER_REVIEW",
        "INSPECTION_SCHEDULED",
        "INSPECTED",
        "APPROVED",
        "REJECTED",
        "RESUBMIT",
      ],
      default: "APPLIED",
    },
    dataQualityScore: { type: Number, default: 0 },
    aiRecommendation: { type: String, enum: ["APPROVE", "REJECT", "REVIEW"], default: "REVIEW" },
    inspection: {
      date: Date,
      inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      checklist: mongoose.Schema.Types.Mixed,
      notes: String,
      result: { type: String, enum: ["PASS", "FAIL", "PENDING"], default: "PENDING" },
    },
    rating: { type: Number, default: 4.0, min: 0, max: 5 },
    approvedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

export const LspProfile = mongoose.model("LspProfile", lspProfileSchema);
