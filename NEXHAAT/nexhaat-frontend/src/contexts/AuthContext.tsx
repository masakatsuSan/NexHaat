import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authApi } from '@/api';
import type { User } from '@/api/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User | null };

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<{
  state: AuthState;
  login: (user: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('nexhaatToken');
      const userStr = localStorage.getItem('nexhaatUser');

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        } catch {
          localStorage.removeItem('nexhaatToken');
          localStorage.removeItem('nexhaatUser');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initAuth();
  }, []);

  const login = (user: User, token: string) => {
    localStorage.setItem('nexhaatToken', token);
    localStorage.setItem('nexhaatUser', JSON.stringify(user));
    dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
  };

  const logout = () => {
    localStorage.removeItem('nexhaatToken');
    localStorage.removeItem('nexhaatUser');
    dispatch({ type: 'LOGOUT' });
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('nexhaatToken');
    if (!token) return;

    try {
      const response = await authApi.getMe();
      const user = response.user;
      localStorage.setItem('nexhaatUser', JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: user });
    } catch {
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}