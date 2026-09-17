import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PrivateRouteProps {
  allowedRoles?: ('FARMER' | 'BUYER')[];
}

export function PrivateRoute({ allowedRoles }: PrivateRouteProps) {
  const { state } = useAuth();
  const location = useLocation();

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-green border-t-transparent" />
      </div>
    );
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(state.user!.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-green border-t-transparent" />
      </div>
    );
  }

  if (state.isAuthenticated) {
    return <Navigate to={state.user?.role === 'BUYER' ? '/buyer/requirements' : '/dashboard'} replace />;
  }

  return <Outlet />;
}