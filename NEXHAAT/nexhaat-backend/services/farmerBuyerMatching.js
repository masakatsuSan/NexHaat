import BuyerRequirement from "../models/BuyerRequirement.js";
import FarmerLot from "../models/FarmerLot.js";
import User from "../models/User.js";

const normalizeText = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const lotSatisfiesRequirement = (lot, requirement) => {
  if (lot.status !== "LISTED" || requirement.status !== "OPEN") return false;
  if (normalizeText(lot.commodity) !== normalizeText(requirement.crop)) return false;
  if (Number(lot.quantity_quintals) < Number(requirement.quantity_quintals)) return false;
  return normalizeText(lot.location || lot.variety) === normalizeText(requirement.location);
};

const formatRequirement = (requirement) => ({
  id: requirement._id,
  crop: requirement.crop,
  quantity_quintals: Number(requirement.quantity_quintals),
  quality_grade: requirement.quality_grade,
  location: requirement.location,
  offered_price_per_quintal: Number(requirement.offered_price_per_quintal),
  status: requirement.status,
});

const formatLot = (lot, farmer) => ({
  id: lot._id,
  crop: lot.commodity,
  location: lot.location || lot.variety,
  quantity_quintals: Number(lot.quantity_quintals),
  quality_grade: lot.quality_grade,
  expected_price_per_quintal: lot.expected_price,
  harvest_date: lot.harvest_date,
  status: lot.status,
  farmer_id: lot.farmer_id,
  farmer_name: farmer?.name || "Unknown",
  farmer_district: farmer?.district || "",
  farmer_state: farmer?.state || "",
});

export const findMatchingLotsForRequirement = async (requirementId) => {
  const requirement = await BuyerRequirement.findById(requirementId).lean();
  if (!requirement) return null;

  const cropPattern = new RegExp(`^${escapeRegExp(requirement.crop.trim())}$`, "i");
  const lots = await FarmerLot.find({ status: "LISTED", commodity: { $regex: cropPattern } })
    .select("_id farmer_id commodity variety location quantity_quintals quality_grade expected_price harvest_date status")
    .lean();
  const matches = lots.filter((lot) => lotSatisfiesRequirement(lot, requirement));
  const farmerIds = [...new Set(matches.map((lot) => lot.farmer_id))];
  const farmers = await User.find({ _id: { $in: farmerIds } }, "name district state").lean();
  const farmerMap = new Map(farmers.map((farmer) => [String(farmer._id), farmer]));

  return {
    requirement: formatRequirement(requirement),
    matches: matches.map((lot) => formatLot(lot, farmerMap.get(String(lot.farmer_id)))),
  };
};
