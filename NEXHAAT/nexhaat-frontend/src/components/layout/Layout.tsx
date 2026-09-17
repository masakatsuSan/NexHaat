import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui';

export function Header() {
  const { state, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = state.isAuthenticated
    ? state.user?.role === 'FARMER'
      ? [
          { path: '/dashboard', label: 'My Farm' },
          { path: '/market', label: 'Market Prices' },
          { path: '/recommend', label: 'Best Mandi' },
          { path: '/price-prediction', label: 'Price Prediction' },
          { path: '/buyer-requirements', label: 'Buyer Requirements' },
        ]
      : [
          { path: '/buyer/dashboard', label: 'My Dashboard' },
          { path: '/buyer/requirements', label: 'Requirements' },
        ]
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-line">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="brand text-xl font-extrabold tracking-wide text-green" aria-label="NexHaat Home">
            NEXHAAT
          </Link>

          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `font-medium transition-colors ${isActive ? 'text-green' : 'text-gray-600 hover:text-green'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {state.isAuthenticated && (
              <>
                <NavLink
                  to="/profile"
                  className="font-medium text-gray-600 hover:text-green transition-colors"
                >
                  Profile
                </NavLink>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Sign Out
                </Button>
              </>
            )}
          </nav>

          <div className="md:hidden flex items-center gap-2">
            {state.isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={logout}>
                Sign Out
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-green font-medium hover:underline">
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-primary text-sm px-4 py-2">
                  Register
                </Link>
              </>
            )}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-green transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 border-t border-line animate-slide-down">
            <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-green/10 text-green' : 'text-gray-600 hover:bg-gray-100'}`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              {state.isAuthenticated && (
                <>
                  <NavLink
                    to="/profile"
                    className="px-3 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </NavLink>
                  <Button variant="ghost" className="w-full justify-start px-3 py-2" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                    Sign Out
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink text-cream py-12 mt-auto">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">NEXHAAT</h3>
            <p className="text-cream/70 text-sm leading-relaxed">
              Farmer-first produce marketplace connecting farmers directly with buyers for fair prices and better profits.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Farmers</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><Link to="/dashboard" className="hover:text-white transition-colors">My Farm</Link></li>
              <li><Link to="/market" className="hover:text-white transition-colors">Market Prices</Link></li>
              <li><Link to="/recommend" className="hover:text-white transition-colors">Best Mandi Finder</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">For Buyers</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><Link to="/buyer/requirements" className="hover:text-white transition-colors">Post Requirements</Link></li>
              <li><Link to="/buyer-requirements" className="hover:text-white transition-colors">Browse Requirements</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-cream/70">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-cream/20 text-center text-sm text-cream/60">
          <p>&copy; {new Date().getFullYear()} NexHaat. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}