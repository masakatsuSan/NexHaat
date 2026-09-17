import tursoClient from "../config/turso.js";

const OTP_EXPIRY_MINUTES = 5; // 5 minutes

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOTP = async (phone, otp) => {
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  // Upsert: insert or update if phone already exists
  await tursoClient.execute({
    sql: `INSERT INTO otp_store (phone, otp, expires_at) VALUES (?, ?, ?)
          ON CONFLICT(phone) DO UPDATE SET otp = ?, expires_at = ?`,
    args: [phone, otp, expiresAt, otp, expiresAt],
  });
};

const verifyOTP = async (phone, otp) => {
  const result = await tursoClient.execute({
    sql: "SELECT * FROM otp_store WHERE phone = ?",
    args: [phone],
  });

  const record = result.rows[0];

  if (!record) {
    return { success: false, message: "OTP not found. Please request a new one." };
  }

  // Check if OTP is expired
  if (new Date(record.expires_at) < new Date()) {
    await tursoClient.execute({
      sql: "DELETE FROM otp_store WHERE phone = ?",
      args: [phone],
    });
    return { success: false, message: "OTP expired. Please request a new one." };
  }

  if (record.otp !== otp) {
    return { success: false, message: "Invalid OTP" };
  }

  // Delete OTP after successful verification
  await tursoClient.execute({
    sql: "DELETE FROM otp_store WHERE phone = ?",
    args: [phone],
  });

  return { success: true, message: "OTP verified" };
};

// Cleanup expired OTPs (can be called periodically)
const cleanupExpiredOTPs = async () => {
  await tursoClient.execute({
    sql: "DELETE FROM otp_store WHERE expires_at < ?",
    args: [new Date().toISOString()],
  });
};

export { generateOTP, storeOTP, verifyOTP, cleanupExpiredOTPs };
