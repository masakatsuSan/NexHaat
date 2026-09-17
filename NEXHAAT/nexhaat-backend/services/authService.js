import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";

const secret = process.env.JWT_SECRET || "change-me-in-production";

export const generateToken = (id, role) => jwt.sign({ id, role }, secret, { expiresIn: "7d" });
export const verifyToken = (token) => jwt.verify(token, secret);

export const findUserByPhone = async (phone) => {
  const user = await User.findOne({ phone }).lean();
  if (!user) return null;
  const { _id, ...rest } = user;
  return { id: _id, ...rest };
};

export const createOrUpdateUser = async ({ phone, name, role, district, state }) => {
  const existing = await User.findOne({ phone });
  if (existing) {
    existing.name = name;
    existing.role = role;
    existing.district = district;
    existing.state = state || existing.state;
    await existing.save();
    return { id: existing._id, phone: existing.phone, name: existing.name, role: existing.role, district: existing.district, state: existing.state };
  }
  const id = uuidv4();
  const user = new User({ _id: id, phone, name, role, district, state: state || "" });
  await user.save();
  return { id, phone, name, role, district, state: state || "" };
};

export const getUserById = async (id) => {
  const user = await User.findById(id).lean();
  if (!user) return null;
  const { _id, ...rest } = user;
  return { id: _id, ...rest };
};