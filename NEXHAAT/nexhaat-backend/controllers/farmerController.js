import FarmerLot from "../models/FarmerLot.js";
import { v4 as uuidv4 } from "uuid";

export const createLot = async (req, res) => {
  try {
    const { crop, quantity, quality, location, expected_price, harvest_date } = req.body;
    const locationValue = String(location).trim();
    if (!crop || !quantity || !quality || !locationValue) return res.status(400).json({ message: "Crop, quantity, quality, and location are required." });
    if (!["Grade-A", "Grade-B", "Grade-C"].includes(quality)) return res.status(400).json({ message: "Quality must be Grade-A, Grade-B, or Grade-C." });
    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) return res.status(400).json({ message: "Quantity must be a positive number." });
    const priceNum = expected_price != null ? Number(expected_price) : null;
    if (priceNum !== null && (isNaN(priceNum) || priceNum < 0)) return res.status(400).json({ message: "Expected price must be a non-negative number." });
    const id = uuidv4();
    const lot = new FarmerLot({ _id: id, farmer_id: req.user.id, commodity: String(crop).trim(), variety: locationValue, location: locationValue, quantity_quintals: qtyNum, quality_grade: quality, harvest_date: harvest_date || null, expected_price: priceNum, status: "LISTED" });
    await lot.save();
    res.status(201).json({ success: true, lot: { id, crop: String(crop).trim(), quantity: qtyNum, quality, location: locationValue, status: "LISTED" } });
  } catch { res.status(500).json({ message: "Unable to publish this lot." }); }
};

export const getMyLots = async (req, res) => {
  const lots = await FarmerLot.find({ farmer_id: req.user.id })
    .sort({ created_at: -1 })
    .select("_id commodity variety location quantity_quintals quality_grade expected_price harvest_date status created_at")
    .lean();
  const mapped = lots.map(lot => ({
    id: lot._id,
    crop: lot.commodity,
    location: lot.location || lot.variety,
    quantity: lot.quantity_quintals,
    quality: lot.quality_grade,
    expected_price: lot.expected_price,
    harvest_date: lot.harvest_date,
    status: lot.status,
    created_at: lot.created_at,
  }));
  res.json({ success: true, lots: mapped });
};

export const getFarmerSummary = async (req, res) => {
  const [count, agg] = await Promise.all([
    FarmerLot.countDocuments({ farmer_id: req.user.id }),
    FarmerLot.aggregate([
      { $match: { farmer_id: req.user.id } },
      { $group: { _id: null, total_quantity: { $sum: "$quantity_quintals" } } }
    ])
  ]);
  const totalQuantity = agg[0]?.total_quantity || 0;
  res.json({ success: true, summary: { total_lots: count, total_quantity_quintals: totalQuantity } });
};