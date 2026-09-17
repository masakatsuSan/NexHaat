import { Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { Layout } from '@/components/layout/Layout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Signup } from '@/pages/Signup';
import { Dashboard } from '@/pages/Dashboard';
import { MarketPrices } from '@/pages/MarketPrices';
import { Recommendations } from '@/pages/Recommendations';
import { BuyerRequirements } from '@/pages/BuyerRequirements';
import { BuyerDashboard } from '@/pages/BuyerDashboard';
import { Profile } from '@/pages/Profile';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="market" element={<MarketPrices />} />
        <Route path="recommend" element={<Recommendations />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Route>

      <Route element={<PrivateRoute allowedRoles={['FARMER']} />}>
        <Route path="dashboard" element={<Dashboard />} />
      </Route>

      <Route element={<PrivateRoute allowedRoles={['BUYER']} />}>
        <Route path="buyer/dashboard" element={<BuyerDashboard />} />
        <Route path="buyer/requirements" element={<BuyerRequirements />} />
      </Route>

      <Route element={<PrivateRoute allowedRoles={['FARMER', 'BUYER']} />}>
        <Route path="buyer-requirements" element={<BuyerRequirements />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}