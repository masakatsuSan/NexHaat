import MandiPrice from "../models/MandiPrice.js";

const MIN_DATA_POINTS = 3;
const TREND_THRESHOLD = 0.02;

export const getPricePrediction = async (crop) => {
  const cropName = String(crop || "").trim();
  if (cropName.length < 2) {
    return {
      success: false,
      crop: cropName,
      signal: "invalid",
      message: "A crop name of at least two characters is required.",
    };
  }

  const records = await MandiPrice.find({ crop: { $regex: new RegExp(`^${cropName}$`, "i") } })
    .sort({ price_date: 1 })
    .lean();

  if (!records.length) {
    return {
      success: false,
      crop: cropName,
      signal: "insufficient data",
      message: `No historical price data found for ${cropName}. Cannot determine trend.`,
    };
  }

  if (records.length < MIN_DATA_POINTS) {
    return {
      success: false,
      crop: cropName,
      signal: "insufficient data",
      message: `Not enough historical price data for ${cropName}. At least ${MIN_DATA_POINTS} data points are required, but only ${records.length} found.`,
    };
  }

  const prices = records.map((r) => Number(r.modal_price_per_quintal)).filter((p) => Number.isFinite(p) && p > 0);

  if (prices.length < MIN_DATA_POINTS) {
    return {
      success: false,
      crop: cropName,
      signal: "insufficient data",
      message: `Not enough valid price data for ${cropName}. At least ${MIN_DATA_POINTS} valid prices are required.`,
    };
  }

  const mid = Math.floor(prices.length / 2);
  const earlierPrices = prices.slice(0, mid);
  const laterPrices = prices.slice(mid);

  const earlierAvg = earlierPrices.reduce((a, b) => a + b, 0) / earlierPrices.length;
  const laterAvg = laterPrices.reduce((a, b) => a + b, 0) / laterPrices.length;

  const changePct = earlierAvg > 0 ? ((laterAvg - earlierAvg) / earlierAvg) * 100 : 0;

  let signal;
  if (changePct > TREND_THRESHOLD * 100) {
    signal = "trending up";
  } else if (changePct < -TREND_THRESHOLD * 100) {
    signal = "trending down";
  } else {
    signal = "stable";
  }

  return {
    success: true,
    crop: cropName,
    signal,
    current_avg: Math.round(laterAvg),
    previous_avg: Math.round(earlierAvg),
    change_pct: Math.round(changePct * 100) / 100,
    data_points: prices.length,
    message: `Prices for ${cropName} are ${signal} based on ${prices.length} data points. Previous avg: ₹${Math.round(earlierAvg)}/quintal, Current avg: ₹${Math.round(laterAvg)}/quintal (${changePct > 0 ? "+" : ""}${changePct.toFixed(2)}%).`,
  };
};
