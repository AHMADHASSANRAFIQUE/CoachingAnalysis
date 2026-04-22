import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isCoach } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/film-analysis', label: 'Film Analysis' },
    { to: '/player-profile', label: 'Player Profile' },
    { to: '/dashboard', label: 'Dashboard' },
    ...(isCoach || !user ? [{ to: '/coaches', label: 'Coaches' }] : []),
    { to: '/pricing', label: 'Pricing' },
  ];

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a] border-b border-[#333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-[#CDFD51] font-bold text-2xl tracking-tight font-lexend">
            LEGEND
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 font-lexend ${
                  location.pathname === link.to
                    ? 'text-[#CDFD51] bg-[#CDFD51]/10'
                    : 'text-white hover:text-[#CDFD51] hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Auth Section */}
            {user ? (
              <div className="relative ml-3">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#444] hover:border-[#CDFD51] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#CDFD51]/20 flex items-center justify-center">
                    <span className="text-[#CDFD51] text-xs font-bold">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-white text-sm font-medium max-w-[120px] truncate">
                    {user.email.split('@')[0]}
                  </span>
                  <svg className={`w-4 h-4 text-[#666] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-[#2a2a2a] border border-[#444] rounded-xl shadow-2xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-[#333]">
                        <p className="text-white text-sm font-medium truncate">{user.email}</p>
                        <p className="text-[#CDFD51] text-xs font-semibold uppercase mt-0.5">
                          {user.role} Account
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/player-profile"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2.5 text-sm text-[#ccc] hover:bg-[#333] hover:text-white transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            My Profile
                          </span>
                        </Link>
                        <Link
                          to="/dashboard"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2.5 text-sm text-[#ccc] hover:bg-[#333] hover:text-white transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Dashboard
                          </span>
                        </Link>
                      </div>
                      <div className="border-t border-[#333] py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-3 px-4 py-2 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-white p-2"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#1a1a1a] border-t border-[#333] pb-4">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`block px-6 py-3 text-sm font-medium font-lexend transition-colors ${
                location.pathname === link.to
                  ? 'text-[#CDFD51] bg-[#CDFD51]/10'
                  : 'text-white hover:text-[#CDFD51]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <div className="border-t border-[#333] mt-2 pt-2 px-6">
              <div className="flex items-center gap-2 py-2">
                <div className="w-7 h-7 rounded-full bg-[#CDFD51]/20 flex items-center justify-center">
                  <span className="text-[#CDFD51] text-xs font-bold">{user.email.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{user.email}</p>
                  <p className="text-[#CDFD51] text-[10px] font-semibold uppercase">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="block w-full text-left py-3 text-sm text-red-400 font-medium"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="block mx-6 mt-3 py-3 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg text-center"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
