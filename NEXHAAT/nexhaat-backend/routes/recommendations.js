import { Router } from "express";
import auth from "../middleware/auth.js";
import roleCheck from "../middleware/roleCheck.js";
import { recommend } from "../controllers/recommendationController.js";

const router = Router();
router.post("/", auth, roleCheck("FARMER"), recommend);
export default router;
