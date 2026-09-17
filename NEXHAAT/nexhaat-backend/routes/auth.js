import { Router } from "express";
import { sendOTP, verifyOTPHandler, getMe } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = Router();

// @route   POST /api/auth/send-otp
// @desc    Send OTP to phone number
router.post("/send-otp", sendOTP);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login/register
router.post("/verify-otp", verifyOTPHandler);

// @route   GET /api/auth/me
// @desc    Get current user profile (protected)
router.get("/me", auth, getMe);

export default router;
