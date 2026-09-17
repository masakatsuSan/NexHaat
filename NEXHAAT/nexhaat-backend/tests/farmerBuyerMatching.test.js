import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import BuyerRequirement from "../models/BuyerRequirement.js";
import FarmerLot from "../models/FarmerLot.js";
import { findMatchingLotsForRequirement, lotSatisfiesRequirement } from "../services/farmerBuyerMatching.js";

let mongoServer;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

test.after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test.beforeEach(async () => {
  await mongoose.connection.dropDatabase();
});

const listedLot = (overrides) => ({
  farmer_id: "farmer-1",
  commodity: "Tomato",
  variety: "Pune",
  location: "Pune",
  quantity_quintals: 120,
  quality_grade: "Grade-A",
  expected_price: 2500,
  harvest_date: null,
  status: "LISTED",
  ...overrides,
});

test("matches only lots that satisfy crop, quantity, and location criteria", async () => {
  await FarmerLot.create([
    listedLot({ commodity: "Tomato", location: "Pune", quantity_quintals: 120 }),
    listedLot({ commodity: "Tomato", location: "Pune", quantity_quintals: 80 }),
    listedLot({ commodity: "Tomato", location: "Nashik", quantity_quintals: 150 }),
    listedLot({ commodity: "Onion", location: "Pune", quantity_quintals: 200 }),
    listedLot({ commodity: "Tomato", location: "Pune", quantity_quintals: 200, status: "SOLD" }),
  ]);

  const requirement = await BuyerRequirement.create({
    buyer_id: "buyer-1",
    crop: "Tomato",
    quantity_quintals: 100,
    quality_grade: "Grade-A",
    location: "Pune",
    offered_price_per_quintal: 2600,
    status: "OPEN",
  });

  const result = await findMatchingLotsForRequirement(requirement._id);

  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].crop, "Tomato");
  assert.equal(result.matches[0].location, "Pune");
  assert.equal(result.matches[0].quantity_quintals, 120);
  assert.equal(result.matches[0].status, "LISTED");
});

test("returns an empty array when no lot matches the crop", async () => {
  await FarmerLot.create([listedLot({ commodity: "Tomato", location: "Pune", quantity_quintals: 120 })]);

  const requirement = await BuyerRequirement.create({
    buyer_id: "buyer-1",
    crop: "Wheat",
    quantity_quintals: 100,
    quality_grade: "Grade-A",
    location: "Pune",
    offered_price_per_quintal: 2200,
    status: "OPEN",
  });

  const result = await findMatchingLotsForRequirement(requirement._id);

  assert.equal(result.matches.length, 0);
});

test("does not return lots that fail quantity, location, or status checks", async () => {
  await FarmerLot.create([
    listedLot({ commodity: "Tomato", location: "Pune", quantity_quintals: 120 }),
    listedLot({ commodity: "Tomato", location: "Pune", quantity_quintals: 80 }),
    listedLot({ commodity: "Tomato", location: "Nashik", quantity_quintals: 150 }),
  ]);

  const requirement = await BuyerRequirement.create({
    buyer_id: "buyer-1",
    crop: "Tomato",
    quantity_quintals: 100,
    quality_grade: "Grade-A",
    location: "Pune",
    offered_price_per_quintal: 2600,
    status: "OPEN",
  });

  const result = await findMatchingLotsForRequirement(requirement._id);

  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].quantity_quintals, 120);
});

test("lotSatisfiesRequirement rejects closed requirements and non-listed lots", () => {
  const openRequirement = { status: "OPEN", crop: "Tomato", quantity_quintals: 100, location: "Pune" };
  assert.equal(lotSatisfiesRequirement({ status: "LISTED", commodity: "Tomato", location: "Pune", quantity_quintals: 120 }, openRequirement), true);
  assert.equal(lotSatisfiesRequirement({ status: "SOLD", commodity: "Tomato", location: "Pune", quantity_quintals: 120 }, openRequirement), false);
  assert.equal(lotSatisfiesRequirement({ status: "LISTED", commodity: "Tomato", location: "Pune", quantity_quintals: 80 }, openRequirement), false);
  assert.equal(lotSatisfiesRequirement({ status: "LISTED", commodity: "Tomato", location: "Nashik", quantity_quintals: 120 }, openRequirement), false);
  assert.equal(lotSatisfiesRequirement({ status: "LISTED", commodity: "Onion", location: "Pune", quantity_quintals: 120 }, openRequirement), false);
});

test("findMatchingLotsForRequirement returns null for unknown requirement", async () => {
  const result = await findMatchingLotsForRequirement("does-not-exist");
  assert.equal(result, null);
});
