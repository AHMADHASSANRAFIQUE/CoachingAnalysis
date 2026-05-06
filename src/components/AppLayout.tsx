import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Home from '@/pages/Home';
import FilmAnalysis from '@/pages/FilmAnalysis';
import PlayerProfile from '@/pages/PlayerProfile';
import Dashboard from '@/pages/Dashboard';
import Coaches from '@/pages/Coaches';
import Pricing from '@/pages/Pricing';
import Login from '@/pages/Login';
import SharedReport from '@/pages/SharedReport';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const AppLayout: React.FC = () => {
  const { isCoach } = useAuth();

  return (
    <div className="min-h-screen bg-[#1a1a1a] font-lexend">
      <Navbar />
      <main className="pt-16">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/shared/:id" element={<SharedReport />} />

          {/* Protected Routes */}
          <Route path="/film-analysis" element={
            <ProtectedRoute>
              <FilmAnalysis />
            </ProtectedRoute>
          } />
          <Route path="/player-profile" element={
            <ProtectedRoute>
              <PlayerProfile />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/coaches" element={
            <ProtectedRoute>
              {isCoach ? <Coaches /> : (
                <div className="min-h-screen flex items-center justify-center px-4 bg-[#1a1a1a]">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Coach Access Only</h2>
                    <p className="text-[#999] text-sm mb-6">
                      This feature is only available for Coach accounts.
                    </p>
                    <a href="/" className="inline-block px-6 py-3 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-colors">
                      Return Home
                    </a>
                  </div>
                </div>
              )}
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
