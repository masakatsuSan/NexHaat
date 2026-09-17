import mongoose from "mongoose";

const mandiSchema = new mongoose.Schema({
  mandi_name: { type: String, required: true },
  district: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
}, { versionKey: false });

mandiSchema.index({ mandi_name: 1, district: 1 }, { unique: true });

export default mongoose.model("Mandi", mandiSchema);