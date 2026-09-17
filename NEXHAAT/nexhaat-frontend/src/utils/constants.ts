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

export const QUALITY_GRADES = [
  { value: 'Grade-A', label: 'Grade A' },
  { value: 'Grade-B', label: 'Grade B' },
  { value: 'Grade-C', label: 'Grade C' },
] as const;

export type QualityGrade = typeof QUALITY_GRADES[number]['value'];

export type QualityGradeOption = { value: QualityGrade; label: string };

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

export const ROLE_LABELS = {
  FARMER: 'Farmer',
  BUYER: 'Buyer',
} as const;

export const STATUS_LABELS = {
  LISTED: 'Listed',
  SOLD: 'Sold',
  OPEN: 'Open',
  CLOSED: 'Closed',
} as const;

export const TRANSPORT_RATE_PER_KM = 4;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const STORAGE_KEYS = {
  TOKEN: 'nexhaatToken',
  USER: 'nexhaatUser',
} as const;