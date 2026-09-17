import FarmerLot from "../models/FarmerLot.js";
import Mandi from "../models/Mandi.js";
import MandiPrice from "../models/MandiPrice.js";
import { haversineKm } from "../utils/haversine.js";
import { refreshLivePrices } from "../services/marketPriceService.js";

const TRANSPORT_RATE_PER_KM = 4;
const isLatitude = (value) => Number.isFinite(value) && value >= -90 && value <= 90;
const isLongitude = (value) => Number.isFinite(value) && value >= -180 && value <= 180;
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export const recommend = async (req, res) => {
  try {
    const { lot_id, latitude, longitude, max_distance_km = 200 } = req.body;
    const maxDistance = Number(max_distance_km);
    const farmerLatitude = Number(latitude);
    const farmerLongitude = Number(longitude);
    if (!lot_id) return res.status(400).json({ message: "lot_id is required." });
    if (!isLatitude(farmerLatitude) || !isLongitude(farmerLongitude)) return res.status(400).json({ message: "Valid farmer latitude and longitude are required." });
    if (!Number.isFinite(maxDistance) || maxDistance <= 0 || maxDistance > 2000) return res.status(400).json({ message: "max_distance_km must be between 0 and 2000." });

    const lot = await FarmerLot.findOne({ _id: lot_id, farmer_id: req.user.id }).lean();
    if (!lot) return res.status(404).json({ message: "NexHaat listing not found." });

    const marketRefresh = await refreshLivePrices({ crop: lot.commodity, state: req.user.state, district: req.user.district });

    const latestDatePerMandi = await MandiPrice.aggregate([
      { $match: { crop: { $regex: new RegExp(`^${lot.commodity}$`, "i") } } },
      { $sort: { price_date: -1 } },
      { $group: { _id: "$mandi_id", latestPrice: { $first: "$$ROOT" } } }
    ]);
    if (!latestDatePerMandi.length) return res.status(404).json({ message: `No NexHaat mandi prices are tracked for ${lot.commodity}.` });

    const mandiIds = latestDatePerMandi.map(item => item.latestPrice.mandi_id);
    const mandis = await Mandi.find({ _id: { $in: mandiIds } }, "mandi_name district latitude longitude _id").lean();
    const mandiMap = new Map(mandis.map(m => [String(m._id), m]));

    const allOptions = latestDatePerMandi.map(item => {
      const p = item.latestPrice;
      const mandi = mandiMap.get(String(p.mandi_id));
      if (!mandi) return null;
      const distance_km = roundMoney(haversineKm(farmerLatitude, farmerLongitude, Number(mandi.latitude), Number(mandi.longitude)));
      const gross_earnings = roundMoney(Number(lot.quantity_quintals) * Number(p.modal_price_per_quintal));
      const transport_cost = roundMoney(distance_km * TRANSPORT_RATE_PER_KM);
      const net_profit = roundMoney(gross_earnings - transport_cost);
      return { mandi_name: mandi.mandi_name, district: mandi.district, modal_price_per_quintal: Number(p.modal_price_per_quintal), distance_km, gross_earnings, transport_cost, net_profit, is_viable: transport_cost < gross_earnings };
    }).filter(Boolean).filter(option => option.distance_km <= maxDistance).sort((a, b) => b.net_profit - a.net_profit);

    if (!allOptions.length) return res.status(400).json({ message: `No mandis for this crop are within ${maxDistance} km.` });
    const best = allOptions[0];
    const viableCount = allOptions.filter(option => option.is_viable).length;
    res.json({
      success: true,
      listing: { id: lot._id, crop: lot.commodity, quantity_quintals: Number(lot.quantity_quintals) },
      transport_rate_per_km: TRANSPORT_RATE_PER_KM,
      price_source: marketRefresh.matched_count > 0 ? "data.gov.in (Agmarknet Live)" : "NexHaat cached mandi prices",
      live_price_matches: marketRefresh.matched_count,
      best_mandi: best.mandi_name,
      net_profit_at_best_mandi: best.net_profit,
      all_options: allOptions,
      smart_advisory: best.is_viable ? `${best.mandi_name} gives the best estimated net realization of ₹${best.net_profit}. ${viableCount} option(s) remain viable after transport.` : "No listed mandi is viable at this quantity and transport rate.",
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ message: "Unable to calculate mandi recommendations." });
  }
};