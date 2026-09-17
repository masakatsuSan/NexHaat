import OTP from "../models/OTP.js";

const OTP_EXPIRY_MINUTES = 5;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOTP = async (phone, otp) => {
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await OTP.findByIdAndUpdate(phone, { otp, expires_at: expiresAt, created_at: new Date() }, { upsert: true, new: true, setDefaultsOnInsert: true });
};

const verifyOTP = async (phone, otp) => {
  const record = await OTP.findById(phone);
  if (!record) {
    return { success: false, message: "OTP not found. Please request a new one." };
  }
  if (new Date(record.expires_at) < new Date()) {
    await OTP.findByIdAndDelete(phone);
    return { success: false, message: "OTP expired. Please request a new one." };
  }
  if (record.otp !== otp) {
    return { success: false, message: "Invalid OTP" };
  }
  await OTP.findByIdAndDelete(phone);
  return { success: true, message: "OTP verified" };
};

const cleanupExpiredOTPs = async () => {
  await OTP.deleteMany({ expires_at: { $lt: new Date() } });
};

export { generateOTP, storeOTP, verifyOTP, cleanupExpiredOTPs };