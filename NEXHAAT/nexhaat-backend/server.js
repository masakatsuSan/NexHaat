import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { initializeDb } from "./config/mongo.js";
import authRoutes from "./routes/auth.js";
import farmerRoutes from "./routes/farmer.js";
import recommendationRoutes from "./routes/recommendations.js";
import marketRoutes from "./routes/market.js";
import buyerRequirementRoutes from "./routes/buyerRequirements.js";

dotenv.config();
const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(helmet());
app.use(express.json());
app.get("/", (_req, res) => res.json({ message: "Welcome to NexHaat API" }));
app.use("/api/auth", authRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/buyer-requirements", buyerRequirementRoutes);

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  await initializeDb();
  app.listen(PORT, () => console.log(`NexHaat API running at http://localhost:${PORT}`));
};
startServer().catch((error) => { console.error("NexHaat could not start:", error.message); process.exit(1); });