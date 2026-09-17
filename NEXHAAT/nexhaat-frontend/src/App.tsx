import { Routes, Route } from 'react-router-dom';
import { PrivateRoute } from './routes/PrivateRoute';
import { Layout } from './components/layout/Layout';
import { AuthLayout } from './components/layout/AuthLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { MarketPrices } from './pages/MarketPrices';
import { Recommendations } from './pages/Recommendations';
import { PricePrediction } from './pages/PricePrediction';
import { BuyerRequirements } from './pages/BuyerRequirements';
import { BuyerDashboard } from './pages/BuyerDashboard';
import { Profile } from './pages/Profile';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="market" element={<MarketPrices />} />
        <Route path="recommend" element={<Recommendations />} />
        <Route path="price-prediction" element={<PricePrediction />} />
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

export default App;