import { Router } from "express";
import auth from "../middleware/auth.js";
import roleCheck from "../middleware/roleCheck.js";
import { getMarketPrices } from "../controllers/marketController.js";
const router = Router();
router.get("/prices", auth, roleCheck("FARMER"), getMarketPrices);
export default router;
