import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mongoServer;

export const connectDb = async () => {
  const uri = process.env.MONGODB_URI;
  if (uri) {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB at", uri);
    return;
  }
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log("Connected to in-memory MongoDB");
};

const seedMandiData = async () => {
  const Mandi = (await import("../models/Mandi.js")).default;
  const MandiPrice = (await import("../models/MandiPrice.js")).default;

  const csvPath = join(__dirname, "..", "data", "mandi_data.csv");
  const data = readFileSync(csvPath, "utf-8").trim().split(/\r?\n/);
  const rows = data.slice(1);

  for (const row of rows) {
    const [priceDate, mandiName, district, crop, modalPrice, latitude, longitude] = row.split(",");
    let mandi = await Mandi.findOne({ mandi_name: mandiName, district });
    if (!mandi) {
      mandi = new Mandi({ mandi_name: mandiName, district, latitude: Number(latitude), longitude: Number(longitude) });
      await mandi.save();
    }
    const price = await MandiPrice.findOne({ mandi_id: mandi._id, crop, price_date: priceDate });
    if (!price) {
      await MandiPrice.create({ mandi_id: mandi._id, crop, modal_price_per_quintal: Number(modalPrice), price_date: priceDate });
    }
  }
  console.log("Mandi data seeded successfully");
};

export const initializeDb = async () => {
  try {
    await connectDb();
    await seedMandiData();
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
};

export const disconnectDb = async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
};

export default mongoose;