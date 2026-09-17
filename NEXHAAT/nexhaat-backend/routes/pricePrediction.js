import { Router } from "express";
import auth from "../middleware/auth.js";
import roleCheck from "../middleware/roleCheck.js";
import { getPriceTrend } from "../controllers/pricePredictionController.js";

const router = Router();
router.use(auth);
router.use(roleCheck("FARMER"));

router.get("/price-prediction", getPriceTrend);

export default router;
