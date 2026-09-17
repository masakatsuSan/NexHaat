export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'FARMER' | 'BUYER';
  district: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  trust_score: number;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  otp?: string;
}

export interface FarmerLot {
  id: string;
  crop: string;
  location: string;
  quantity: number;
  quality: 'Grade-A' | 'Grade-B' | 'Grade-C';
  expected_price: number | null;
  harvest_date: string | null;
  status: 'LISTED' | 'SOLD';
  created_at: string;
}

export interface CreateLotRequest {
  crop: string;
  quantity: number;
  quality: 'Grade-A' | 'Grade-B' | 'Grade-C';
  location: string;
  expected_price?: number;
  harvest_date?: string;
}

export interface FarmerSummary {
  total_lots: number;
  total_quantity_quintals: number;
}

export interface MandiPriceRecord {
  mandi_name: string;
  district: string;
  state?: string;
  modal_price_per_quintal: number;
  min_price_per_quintal?: number;
  max_price_per_quintal?: number;
  price_date?: string;
}

export interface MarketPricesResponse {
  success: boolean;
  crop: string;
  source: string;
  is_live: boolean;
  notice?: string;
  records: MandiPriceRecord[];
  comparison: MandiPriceRecord[];
}

export interface BuyerRequirement {
  id: string;
  crop: string;
  quantity_quintals: number;
  quality_grade: 'Grade-A' | 'Grade-B' | 'Grade-C';
  location: string;
  offered_price_per_quintal: number;
  status: 'OPEN' | 'CLOSED';
  created_at: string;
  updated_at: string;
  buyer_name?: string;
  buyer_district?: string;
  buyer_state?: string;
}

export interface MatchedFarmerLot {
  id: string;
  crop: string;
  location: string;
  quantity_quintals: number;
  quality_grade: 'Grade-A' | 'Grade-B' | 'Grade-C';
  expected_price_per_quintal: number | null;
  harvest_date: string | null;
  status: 'LISTED' | 'SOLD';
  farmer_id: string;
  farmer_name: string;
  farmer_district: string;
  farmer_state: string;
}

export interface MatchesResponse {
  success: boolean;
  requirement: BuyerRequirement;
  matches: MatchedFarmerLot[];
}

export interface CreateRequirementRequest {
  crop: string;
  quantity: number;
  quality: 'Grade-A' | 'Grade-B' | 'Grade-C';
  location: string;
  price: number;
}

export interface RecommendationOption {
  mandi_name: string;
  district: string;
  modal_price_per_quintal: number;
  distance_km: number;
  gross_earnings: number;
  transport_cost: number;
  net_profit: number;
  is_viable: boolean;
}

export interface RecommendationResponse {
  success: boolean;
  listing: {
    id: string;
    crop: string;
    quantity_quintals: number;
  };
  transport_rate_per_km: number;
  price_source: string;
  live_price_matches: number;
  best_mandi: string;
  net_profit_at_best_mandi: number;
  all_options: RecommendationOption[];
  smart_advisory: string;
}

export interface RecommendationRequest {
  lot_id: string;
  latitude: number;
  longitude: number;
  max_distance_km: number;
}

export interface ApiError {
  message: string;
}

export interface PricePredictionResponse {
  success: boolean;
  crop: string;
  signal: "trending up" | "trending down" | "stable" | "insufficient data" | "invalid";
  current_avg?: number;
  previous_avg?: number;
  change_pct?: number;
  data_points?: number;
  message: string;
}

export type QualityGrade = 'Grade-A' | 'Grade-B' | 'Grade-C';

export const QUALITY_GRADES: QualityGrade[] = ['Grade-A', 'Grade-B', 'Grade-C'];

export const CROPS = [
  'Tomato',
  'Onion',
  'Potato',
  'Wheat',
  'Rice',
  'Maize',
  'Soybean',
  'Cotton',
  'Banana',
  'Mango',
  'Apple',
  'Grapes',
  'Orange',
  'Pomegranate',
  'Cauliflower',
  'Cabbage',
  'Spinach',
  'Carrot',
  'Beetroot',
  'Radish',
] as const;

export type Crop = typeof CROPS[number];

export const STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
] as const;

export type State = typeof STATES[number];