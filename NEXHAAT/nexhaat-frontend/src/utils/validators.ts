import { z } from 'zod';

export const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number');

export const otpSchema = z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers');

export const nameSchema = z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters');

export const districtSchema = z.string().min(2, 'District is required').max(50, 'District name too long');

export const stateSchema = z.string().max(50, 'State name too long').optional();

export const cropSchema = z.string().min(1, 'Crop is required').max(50, 'Crop name too long');

export const quantitySchema = z.coerce.number().positive('Quantity must be positive').max(10000, 'Quantity too large');

export const qualitySchema = z.enum(['Grade-A', 'Grade-B', 'Grade-C'], { errorMap: () => ({ message: 'Quality must be Grade-A, Grade-B, or Grade-C' }) });

export const priceSchema = z.coerce.number().min(0, 'Price must be non-negative');

export const locationSchema = z.string().min(1, 'Location is required').max(100, 'Location name too long');

export const latitudeSchema = z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90');

export const longitudeSchema = z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180');

export const distanceSchema = z.coerce.number().min(1, 'Distance must be at least 1 km').max(2000, 'Distance must be at most 2000 km');

export const loginSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export const signupSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  district: districtSchema,
  state: stateSchema,
  role: z.enum(['FARMER', 'BUYER']),
  otp: otpSchema,
});

export const createLotSchema = z.object({
  crop: cropSchema,
  quantity: quantitySchema,
  quality: qualitySchema,
  location: locationSchema,
  expected_price: priceSchema.optional(),
  harvest_date: z.string().optional(),
});

export const createRequirementSchema = z.object({
  crop: cropSchema,
  quantity: quantitySchema,
  quality: qualitySchema,
  location: locationSchema,
  price: z.coerce.number().min(1, 'Price must be at least 1'),
});

export const recommendationSchema = z.object({
  lot_id: z.string().uuid('Invalid lot ID'),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  max_distance_km: distanceSchema,
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type CreateLotFormData = z.infer<typeof createLotSchema>;
export type CreateRequirementFormData = z.infer<typeof createRequirementSchema>;
export type RecommendationFormData = z.infer<typeof recommendationSchema>;