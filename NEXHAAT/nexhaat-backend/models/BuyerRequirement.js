import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const buyerRequirementSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  buyer_id: { type: String, required: true, index: true },
  crop: { type: String, required: true },
  quantity_quintals: { type: Number, required: true },
  quality_grade: { type: String, enum: ["Grade-A", "Grade-B", "Grade-C"], required: true },
  location: { type: String, required: true },
  offered_price_per_quintal: { type: Number, required: true },
  status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { versionKey: false });

export default mongoose.model("BuyerRequirement", buyerRequirementSchema);