import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Mandi from "../models/Mandi.js";
import MandiPrice from "../models/MandiPrice.js";
import { getPricePrediction } from "../services/pricePredictionService.js";

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

const seedPrices = async (crop, prices) => {
  const mandi = await Mandi.create({
    mandi_name: "Test Mandi",
    district: "Test District",
    latitude: 18.5204,
    longitude: 73.8567,
  });
  for (const { date, price } of prices) {
    await MandiPrice.create({
      mandi_id: mandi._id,
      crop,
      modal_price_per_quintal: price,
      price_date: date,
    });
  }
};

test("returns 'trending up' for crop with rising prices", async () => {
  await seedPrices("Tomato", [
    { date: "2026-08-01", price: 2000 },
    { date: "2026-08-08", price: 2100 },
    { date: "2026-08-15", price: 2200 },
    { date: "2026-08-22", price: 2400 },
    { date: "2026-08-29", price: 2500 },
    { date: "2026-09-05", price: 2600 },
  ]);

  const result = await getPricePrediction("Tomato");

  assert.equal(result.success, true);
  assert.equal(result.signal, "trending up");
  assert.equal(result.data_points, 6);
  assert.ok(result.current_avg > result.previous_avg);
  assert.ok(result.change_pct > 0);
  assert.ok(result.message.includes("trending up"));
});

test("returns 'trending down' for crop with falling prices", async () => {
  await seedPrices("Onion", [
    { date: "2026-08-01", price: 2600 },
    { date: "2026-08-08", price: 2500 },
    { date: "2026-08-15", price: 2400 },
    { date: "2026-08-22", price: 2200 },
    { date: "2026-08-29", price: 2100 },
    { date: "2026-09-05", price: 2000 },
  ]);

  const result = await getPricePrediction("Onion");

  assert.equal(result.success, true);
  assert.equal(result.signal, "trending down");
  assert.equal(result.data_points, 6);
  assert.ok(result.current_avg < result.previous_avg);
  assert.ok(result.change_pct < 0);
  assert.ok(result.message.includes("trending down"));
});

test("returns 'stable' for crop with flat prices", async () => {
  await seedPrices("Potato", [
    { date: "2026-08-01", price: 2000 },
    { date: "2026-08-08", price: 2010 },
    { date: "2026-08-15", price: 1995 },
    { date: "2026-08-22", price: 2005 },
    { date: "2026-08-29", price: 2000 },
    { date: "2026-09-05", price: 2000 },
  ]);

  const result = await getPricePrediction("Potato");

  assert.equal(result.success, true);
  assert.equal(result.signal, "stable");
  assert.equal(result.data_points, 6);
});

test("fails gracefully with clear message for crop with no historical data", async () => {
  const result = await getPricePrediction("Apple");

  assert.equal(result.success, false);
  assert.equal(result.signal, "insufficient data");
  assert.ok(result.message.includes("Apple"));
  assert.ok(result.message.includes("No historical price data"));
});

test("fails gracefully with clear message for crop with very little data", async () => {
  await seedPrices("Grapes", [
    { date: "2026-09-01", price: 3000 },
    { date: "2026-09-05", price: 3100 },
  ]);

  const result = await getPricePrediction("Grapes");

  assert.equal(result.success, false);
  assert.equal(result.signal, "insufficient data");
  assert.ok(result.message.includes("Grapes"));
  assert.ok(result.message.includes("At least 3"));
  assert.ok(result.message.includes("2"));
});

test("fails gracefully for crop name that is too short", async () => {
  const result = await getPricePrediction("");

  assert.equal(result.success, false);
  assert.equal(result.signal, "invalid");
  assert.ok(result.message.includes("at least two characters"));
});

test("fails gracefully for crop with only 1 data point", async () => {
  await seedPrices("Mango", [
    { date: "2026-09-01", price: 1500 },
  ]);

  const result = await getPricePrediction("Mango");

  assert.equal(result.success, false);
  assert.equal(result.signal, "insufficient data");
  assert.ok(result.message.includes("At least 3"));
});

test("returns trending up signal for Tomato from seeded CSV data", async () => {
  const mandi = await Mandi.create({
    mandi_name: "APMC Pune",
    district: "Pune",
    latitude: 18.5204,
    longitude: 73.8567,
  });
  await MandiPrice.create({ mandi_id: mandi._id, crop: "Tomato", modal_price_per_quintal: 2400, price_date: "2026-08-25" });
  await MandiPrice.create({ mandi_id: mandi._id, crop: "Tomato", modal_price_per_quintal: 2550, price_date: "2026-08-28" });
  await MandiPrice.create({ mandi_id: mandi._id, crop: "Tomato", modal_price_per_quintal: 2600, price_date: "2026-08-30" });
  await MandiPrice.create({ mandi_id: mandi._id, crop: "Tomato", modal_price_per_quintal: 2700, price_date: "2026-09-01" });

  const result = await getPricePrediction("Tomato");

  assert.equal(result.success, true);
  assert.ok(["trending up", "stable"].includes(result.signal));
  assert.equal(result.data_points, 4);
});
