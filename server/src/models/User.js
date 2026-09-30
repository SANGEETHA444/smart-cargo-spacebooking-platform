import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["TRADER", "LSP", "ADMIN"], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    company: {
      name: String,
      gst: String,
      iec: String,
      businessType: String,
      address: String,
      location: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },
  },
  { timestamps: true }
);

userSchema.index({ "company.location": "2dsphere" });

export const User = mongoose.model("User", userSchema);
