import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signUp, signIn, user } = useAuth();
  const [role, setRole] = useState<'player' | 'coach'>('coach');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      if (user.role === 'coach') navigate('/coaches');
      else navigate('/player-profile');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isSignup) {
        const { error: signUpError } = await signUp(email, password, role);
        if (signUpError) {
          setError(signUpError);
        } else {
          setSuccessMsg('Account created! You can now log in.');
          setIsSignup(false);
        }
      } else {
        const { error: signInError, role: userRole } = await signIn(email, password);
        if (signInError) {
          setError(signInError);
        } else {
          if (userRole === 'coach') {
            navigate('/coaches');
          } else {
            navigate('/player-profile');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-lexend min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-[#CDFD51] mb-2">LEGEND</h1>
          <p className="text-[#999] text-sm">{isSignup ? 'Create your account' : 'Welcome back'}</p>
        </div>

        <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-8">
          {/* Role Selector */}
          <div className="flex rounded-lg bg-[#1a1a1a] p-1 mb-6">
            <button
              onClick={() => setRole('player')}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                role === 'player'
                  ? 'bg-[#CDFD51] text-[#1a1a1a]'
                  : 'text-[#999] hover:text-white'
              }`}
            >
              I am a Player
            </button>
            <button
              onClick={() => setRole('coach')}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                role === 'coach'
                  ? 'bg-[#CDFD51] text-[#1a1a1a]'
                  : 'text-[#999] hover:text-white'
              }`}
            >
              I am a Coach
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#999] text-xs mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#999] text-xs mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password (min 6 characters)"
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-xs">{error}</p>
              </div>
            )}

            {successMsg && (
              <div className="bg-[#CDFD51]/10 border border-[#CDFD51]/30 rounded-lg p-3">
                <p className="text-[#CDFD51] text-xs">{successMsg}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-all disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isSignup ? 'Creating Account...' : 'Logging In...'}
                </span>
              ) : (
                isSignup ? 'Create Account' : 'Login'
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMsg(''); }}
              className="text-[#CDFD51] text-sm font-medium hover:underline"
            >
              {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        <p className="text-[#666] text-xs text-center mt-6">
          {role === 'player'
            ? 'Player accounts get access to personal profiles and film analysis.'
            : 'Coach accounts get full dashboard access and team management tools.'}
        </p>
      </div>
    </div>
  );
};

export default Login;
