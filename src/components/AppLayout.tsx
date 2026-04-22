import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { useAuth } from '@/contexts/AuthContext';

const CoachProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isCoach } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#333] border-t-[#CDFD51] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isCoach) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Coach Access Only</h2>
          <p className="text-[#999] text-sm mb-6">
            The Coach Dashboard is only available to users with a Coach account. 
            Please sign up as a Coach to access this feature.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/login" className="px-6 py-3 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-colors">
              Sign Up as Coach
            </a>
            <a href="/player-profile" className="px-6 py-3 border border-[#555] text-white text-sm rounded-lg hover:border-[#CDFD51] transition-colors">
              Go to Player Profile
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#1a1a1a] font-lexend">
      <Navbar />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/film-analysis" element={<FilmAnalysis />} />
          <Route path="/player-profile" element={<PlayerProfile />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/coaches" element={
            <CoachProtectedRoute>
              <Coaches />
            </CoachProtectedRoute>
          } />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/shared/:id" element={<SharedReport />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
