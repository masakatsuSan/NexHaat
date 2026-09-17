import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  otp: { type: String, required: true },
  expires_at: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("OTP", otpSchema);