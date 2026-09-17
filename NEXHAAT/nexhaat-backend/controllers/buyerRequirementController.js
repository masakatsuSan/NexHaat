import BuyerRequirement from "../models/BuyerRequirement.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";

const grades = new Set(["Grade-A", "Grade-B", "Grade-C"]);
const validRequirement = ({ crop, quantity, quality, location, price }) => crop && Number(quantity) > 0 && grades.has(quality) && location && Number(price) > 0;
const format = (row) => ({ ...row, quantity_quintals: Number(row.quantity_quintals), offered_price_per_quintal: Number(row.offered_price_per_quintal) });

export const createRequirement = async (req, res) => {
  const { crop, quantity, quality, location, price } = req.body;
  if (!validRequirement({ crop, quantity, quality, location, price })) return res.status(400).json({ message: "Crop, positive quantity and price, Grade A/B/C quality, and location are required." });
  const id = uuidv4();
  const reqDoc = new BuyerRequirement({ _id: id, buyer_id: req.user.id, crop: crop.trim(), quantity_quintals: Number(quantity), quality_grade: quality, location: location.trim(), offered_price_per_quintal: Number(price), status: "OPEN" });
  await reqDoc.save();
  res.status(201).json({ success: true, requirement: { id, crop: crop.trim(), quantity_quintals: Number(quantity), quality_grade: quality, location: location.trim(), offered_price_per_quintal: Number(price), status: "OPEN" } });
};

export const browseRequirements = async (_req, res) => {
  const requirements = await BuyerRequirement.find({ status: "OPEN" })
    .sort({ created_at: -1 })
    .lean();
  const buyerIds = [...new Set(requirements.map(r => r.buyer_id))];
  const buyers = await User.find({ _id: { $in: buyerIds } }, "name district state").lean();
  const buyerMap = new Map(buyers.map(b => [b._id, b]));
  const mapped = requirements.map(r => {
    const buyer = buyerMap.get(r.buyer_id);
    return format({ ...r, buyer_name: buyer?.name || "Unknown", buyer_district: buyer?.district || "", buyer_state: buyer?.state || "" });
  });
  res.json({ success: true, requirements: mapped });
};

export const getMyRequirements = async (req, res) => {
  const requirements = await BuyerRequirement.find({ buyer_id: req.user.id })
    .sort({ created_at: -1 })
    .lean();
  res.json({ success: true, requirements: requirements.map(format) });
};

export const updateRequirement = async (req, res) => {
  const current = await BuyerRequirement.findOne({ _id: req.params.id, buyer_id: req.user.id }).lean();
  if (!current) return res.status(404).json({ message: "Buyer requirement not found." });
  const input = { crop: req.body.crop ?? current.crop, quantity: req.body.quantity ?? current.quantity_quintals, quality: req.body.quality ?? current.quality_grade, location: req.body.location ?? current.location, price: req.body.price ?? current.offered_price_per_quintal };
  const status = req.body.status ?? current.status;
  if (!validRequirement(input) || !["OPEN", "CLOSED"].includes(status)) return res.status(400).json({ message: "Provide valid requirement values and status." });
  await BuyerRequirement.findByIdAndUpdate(req.params.id, { crop: input.crop.trim(), quantity_quintals: Number(input.quantity), quality_grade: input.quality, location: input.location.trim(), offered_price_per_quintal: Number(input.price), status, updated_at: new Date() });
  res.json({ success: true, message: "Buyer requirement updated." });
};

export const closeRequirement = async (req, res) => {
  const result = await BuyerRequirement.findByIdAndUpdate(req.params.id, { status: "CLOSED", updated_at: new Date() }, { new: true });
  if (!result) return res.status(404).json({ message: "Buyer requirement not found." });
  res.json({ success: true, message: "Buyer requirement closed." });
};