import Mandi from "../models/Mandi.js";
import MandiPrice from "../models/MandiPrice.js";

const RESOURCE_ID = process.env.AGMARKNET_RESOURCE_ID || "9ef84268-d588-465a-a308-a864a43d0070";
const BASE_URL = "https://api.data.gov.in/resource";
const COMMODITY_ALIASES = { Soybean: "Soyabean", Chilli: "Green Chilli", Tur: "Arhar (Tur/Red Gram)(Whole)" };
const canonical = (value) => String(value || "").toLowerCase().replace(/apmc|market|mandi|yard|[^a-z0-9]/g, "");
const isoDate = (value) => {
  const [day, month, year] = String(value || "").split("/");
  return day && month && year ? `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}` : new Date().toISOString().slice(0, 10);
};

export const fetchAgmarknetPrices = async ({ crop, state, district, limit = 50 }) => {
  const apiKey = process.env.AGMARKNET_API_KEY || process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) return { is_live: false, records: [], reason: "AGMARKNET_API_KEY is not configured." };
  const url = new URL(`${BASE_URL}/${RESOURCE_ID}`);
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(Math.min(limit, 100)));
  url.searchParams.set("filters[commodity]", COMMODITY_ALIASES[crop] || crop);
  if (state) url.searchParams.set("filters[state]", state);
  if (district) url.searchParams.set("filters[district]", district);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return { is_live: false, records: [], reason: `Agmarknet returned HTTP ${response.status}.` };
    const payload = await response.json();
    const records = (payload.records || []).map((row) => ({
      mandi_name: row.market || "Unknown market", district: row.district || district || "Unknown",
      state: row.state || state || "India", crop: row.commodity || crop, arrival_date: isoDate(row.arrival_date),
      min_price_per_quintal: Number(row.min_price), max_price_per_quintal: Number(row.max_price),
      modal_price_per_quintal: Number(row.modal_price),
    })).filter((row) => Number.isFinite(row.modal_price_per_quintal) && row.modal_price_per_quintal > 0);
    return { is_live: records.length > 0, records, reason: records.length ? undefined : "Agmarknet returned no usable market prices." };
  } catch (error) { return { is_live: false, records: [], reason: `Agmarknet request failed: ${error.message}` }; }
};

export const refreshLivePrices = async ({ crop, state, district }) => {
  const live = await fetchAgmarknetPrices({ crop, state, district });
  if (!live.is_live) return { ...live, matched_count: 0 };
  const localMandis = await Mandi.find({}, "mandi_name district _id").lean();
  let matchedCount = 0;
  for (const record of live.records) {
    const mandi = localMandis.find((item) => canonical(item.mandi_name) === canonical(record.mandi_name) && canonical(item.district) === canonical(record.district));
    if (!mandi) continue;
    await MandiPrice.findOneAndUpdate(
      { mandi_id: mandi._id, crop, price_date: record.arrival_date },
      { modal_price_per_quintal: record.modal_price_per_quintal },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    matchedCount += 1;
  }
  return { ...live, matched_count: matchedCount };
};

export const localPriceComparison = async (crop) => {
  const latestDatePerMandi = await MandiPrice.aggregate([
    { $match: { crop: { $regex: new RegExp(`^${crop}$`, "i") } } },
    { $sort: { price_date: -1 } },
    { $group: { _id: "$mandi_id", latestPrice: { $first: "$$ROOT" } } }
  ]);
  const mandiIds = latestDatePerMandi.map(item => item.latestPrice.mandi_id);
  const mandis = await Mandi.find({ _id: { $in: mandiIds } }, "mandi_name district _id").lean();
  const mandiMap = new Map(mandis.map(m => [String(m._id), m]));
  return latestDatePerMandi.map(item => {
    const p = item.latestPrice;
    const mandi = mandiMap.get(String(p.mandi_id));
    return { mandi_name: mandi?.mandi_name || "Unknown", district: mandi?.district || "Unknown", modal_price_per_quintal: p.modal_price_per_quintal, price_date: p.price_date };
  });
};