export const ENDPOINTS = {
  auth: {
    sendOtp: '/auth/send-otp',
    verifyOtp: '/auth/verify-otp',
    me: '/auth/me',
  },
  farmer: {
    lots: '/farmer/lots',
    myLots: '/farmer/lots/my-lots',
    summary: '/farmer/summary',
  },
  market: {
    prices: '/market/prices',
    pricePrediction: '/market/price-prediction',
  },
  recommend: '/recommend',
  buyerRequirements: {
    base: '/buyer-requirements',
    mine: '/buyer-requirements/mine',
    byId: (id: string) => `/buyer-requirements/${id}`,
    matches: (id: string) => `/buyer-requirements/${id}/matches`,
  },
} as const;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';