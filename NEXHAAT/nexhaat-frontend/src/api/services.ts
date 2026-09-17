import { api } from './client';
import { ENDPOINTS } from './endpoints';
import type {
  AuthResponse,
  OTPResponse,
  User,
  FarmerLot,
  CreateLotRequest,
  FarmerSummary,
  MarketPricesResponse,
  PricePredictionResponse,
  BuyerRequirement,
  CreateRequirementRequest,
  RecommendationResponse,
  RecommendationRequest,
  MatchesResponse,
} from './types';

export const authApi = {
  sendOtp: (phone: string) =>
    api.post<OTPResponse>(ENDPOINTS.auth.sendOtp, { phone }),

  verifyOtp: (data: {
    phone: string;
    otp: string;
    name?: string;
    role?: 'FARMER' | 'BUYER';
    district?: string;
    state?: string;
  }) => api.post<AuthResponse>(ENDPOINTS.auth.verifyOtp, data),

  getMe: () => api.get<{ success: boolean; user: User }>(ENDPOINTS.auth.me),
};

export const farmerApi = {
  createLot: (data: CreateLotRequest) =>
    api.post<{ success: boolean; lot: FarmerLot }>(ENDPOINTS.farmer.lots, data),

  getMyLots: () =>
    api.get<{ success: boolean; lots: FarmerLot[] }>(ENDPOINTS.farmer.myLots),

  getSummary: () =>
    api.get<{ success: boolean; summary: FarmerSummary }>(ENDPOINTS.farmer.summary),
};

export const marketApi = {
  getPrices: (crop: string, state?: string, district?: string) => {
    const params = new URLSearchParams({ crop });
    if (state) params.set('state', state);
    if (district) params.set('district', district);
    return api.get<MarketPricesResponse>(`${ENDPOINTS.market.prices}?${params.toString()}`);
  },

  getPricePrediction: (crop: string) => api.get<PricePredictionResponse>(`${ENDPOINTS.market.pricePrediction}?crop=${crop}`),
};

export const recommendationApi = {
  getRecommendations: (data: RecommendationRequest) =>
    api.post<RecommendationResponse>(ENDPOINTS.recommend, data),
};

export const buyerRequirementApi = {
  browse: () =>
    api.get<{ success: boolean; requirements: BuyerRequirement[] }>(ENDPOINTS.buyerRequirements.base),

  create: (data: CreateRequirementRequest) =>
    api.post<{ success: boolean; requirement: BuyerRequirement }>(ENDPOINTS.buyerRequirements.base, data),

  getMine: () =>
    api.get<{ success: boolean; requirements: BuyerRequirement[] }>(ENDPOINTS.buyerRequirements.mine),

  update: (id: string, data: Partial<CreateRequirementRequest> & { status?: 'OPEN' | 'CLOSED' }) =>
    api.patch<{ success: boolean; message: string }>(ENDPOINTS.buyerRequirements.byId(id), data),

  close: (id: string) =>
    api.delete<{ success: boolean; message: string }>(ENDPOINTS.buyerRequirements.byId(id)),

  getMatches: (id: string) =>
    api.get<MatchesResponse>(ENDPOINTS.buyerRequirements.matches(id)),
};