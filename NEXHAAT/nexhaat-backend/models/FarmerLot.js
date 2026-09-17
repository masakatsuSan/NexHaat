import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const farmerLotSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  farmer_id: { type: String, required: true, index: true },
  commodity: { type: String, required: true },
  variety: { type: String, required: true },
  location: { type: String, required: true },
  quantity_quintals: { type: Number, required: true },
  quality_grade: { type: String, enum: ["Grade-A", "Grade-B", "Grade-C"], required: true },
  harvest_date: { type: Date, default: null },
  expected_price: { type: Number, default: null },
  status: { type: String, enum: ["LISTED", "SOLD"], default: "LISTED" },
  created_at: { type: Date, default: Date.now },
}, { versionKey: false });

export default mongoose.model("FarmerLot", farmerLotSchema);