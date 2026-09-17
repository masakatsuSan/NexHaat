import { localPriceComparison, refreshLivePrices } from "../services/marketPriceService.js";

// GET /api/market/prices?crop=Tomato — normalized mandi price comparison.
export const getMarketPrices = async (req, res) => {
  const crop = String(req.query.crop || "").trim();
  if (crop.length < 2) return res.status(400).json({ message: "A crop query of at least two characters is required." });
  const state = req.query.state || req.user.state;
  const district = req.query.district || req.user.district;
  const live = await refreshLivePrices({ crop, state, district });
  const comparison = await localPriceComparison(crop);
  res.json({ success: true, crop, source: live.is_live ? "data.gov.in (Agmarknet Live)" : "NexHaat cached mandi prices", is_live: live.is_live, notice: live.reason, records: live.is_live ? live.records : comparison, comparison });
};
