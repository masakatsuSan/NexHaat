import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  role: { type: String, enum: ["FARMER", "BUYER"], required: true },
  district: { type: String, required: true },
  state: { type: String, default: "" },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  is_verified: { type: Boolean, default: true },
  trust_score: { type: Number, default: 100.0 },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

export default mongoose.model("User", userSchema);