import mongoose from "mongoose";

const mandiPriceSchema = new mongoose.Schema({
  mandi_id: { type: mongoose.Schema.Types.ObjectId, ref: "Mandi", required: true },
  crop: { type: String, required: true },
  modal_price_per_quintal: { type: Number, required: true },
  price_date: { type: String, required: true },
}, { versionKey: false });

mandiPriceSchema.index({ mandi_id: 1, crop: 1, price_date: 1 }, { unique: true });

export default mongoose.model("MandiPrice", mandiPriceSchema);