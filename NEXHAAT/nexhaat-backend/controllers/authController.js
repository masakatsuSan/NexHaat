import { generateOTP, storeOTP, verifyOTP } from "../services/otpService.js";
import { createOrUpdateUser, findUserByPhone, generateToken, getUserById } from "../services/authService.js";

export const sendOTP = async (req, res) => {
  const { phone } = req.body;
  if (!/^[6-9]\d{9}$/.test(phone || "")) return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number." });
  const otp = generateOTP();
  await storeOTP(phone, otp);
  console.log(`NexHaat demo OTP for ${phone}: ${otp}`);
  res.json({ success: true, message: "OTP sent.", otp });
};
export const verifyOTPHandler = async (req, res) => {
  try {
    const { phone, otp, name, role, district, state } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP are required." });
    const check = await verifyOTP(phone, otp);
    if (!check.success) return res.status(400).json({ message: check.message });
    const existing = await findUserByPhone(phone);
    if (existing) return res.json({ success: true, token: generateToken(existing.id, existing.role), user: existing });
    if (!name || !district || !["FARMER", "BUYER"].includes(role)) return res.status(400).json({ message: "Name, location, and a valid Farmer or Buyer role are required." });
    const user = await createOrUpdateUser({ phone, name, role, district, state });
    res.json({ success: true, token: generateToken(user.id, user.role), user });
  } catch { res.status(500).json({ message: "Authentication failed." }); }
};
export const getMe = async (req, res) => {
  const user = await getUserById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found." });
  res.json({ success: true, user });
};
