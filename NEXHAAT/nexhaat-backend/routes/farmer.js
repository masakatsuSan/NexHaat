import { Router } from "express";
import { createLot, getMyLots, getFarmerSummary } from "../controllers/farmerController.js";
import auth from "../middleware/auth.js";
import roleCheck from "../middleware/roleCheck.js";

const router = Router();

// All farmer routes require authentication and FARMER role
router.use(auth);
router.use(roleCheck("FARMER"));

// @route   POST /api/farmer/lots
// @desc    Create a new farmer lot
router.post("/lots", createLot);

// @route   GET /api/farmer/lots/my-lots
// @desc    Get all lots for the logged-in farmer
router.get("/lots/my-lots", getMyLots);

// @route   GET /api/farmer/summary
// @desc    Get farmer summary
router.get("/summary", getFarmerSummary);

export default router;
