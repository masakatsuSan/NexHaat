import { getPricePrediction } from "../services/pricePredictionService.js";

export const getPriceTrend = async (req, res) => {
  try {
    const crop = String(req.query.crop || "").trim();
    const result = await getPricePrediction(crop);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error("Price prediction error:", error);
    res.status(500).json({ success: false, message: "Unable to fetch price prediction." });
  }
};
