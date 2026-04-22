import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  role: 'player' | 'coach';
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, role: 'player' | 'coach') => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: string }>;
  signOut: () => Promise<void>;
  isCoach: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  isCoach: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (authUser: User): Promise<AuthUser | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (data) {
        return {
          id: authUser.id,
          email: authUser.email || '',
          role: data.role || 'player',
        };
      }

      // Profile doesn't exist yet - check localStorage for role
      const localRole = localStorage.getItem('legend_role') as 'player' | 'coach' || 'player';
      
      // Create profile
      const { error: insertError } = await supabase.from('user_profiles').insert({
        user_id: authUser.id,
        email: authUser.email,
        role: localRole,
        display_name: authUser.email?.split('@')[0] || '',
      });

      if (insertError) {
        console.error('Error creating user profile:', insertError);
      }

      return {
        id: authUser.id,
        email: authUser.email || '',
        role: localRole,
      };
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return {
        id: authUser.id,
        email: authUser.email || '',
        role: 'player',
      };
    }
  }, []);

  // Sync localStorage data to database
  const syncLocalStorageToDb = useCallback(async (userId: string) => {
    try {
      // Sync player profiles
      const localPlayers = localStorage.getItem('legend_players');
      if (localPlayers) {
        const players = JSON.parse(localPlayers);
        for (const p of players) {
          const { error } = await supabase.from('player_profiles').upsert({
            id: p.id?.length === 36 ? p.id : undefined, // only use if UUID
            user_id: userId,
            name: p.name,
            position: p.position,
            jersey_number: p.jerseyNumber,
            team_name: p.teamName,
            age: p.age,
            season_year: p.seasonYear,
          }, { onConflict: 'id' }).select();
        }
        localStorage.removeItem('legend_players');
      }

      // Sync game sessions
      const localSessions = localStorage.getItem('legend_sessions');
      if (localSessions) {
        const sessions = JSON.parse(localSessions);
        for (const s of sessions) {
          await supabase.from('game_sessions').insert({
            user_id: userId,
            player_id: null,
            date: s.date,
            opponent: s.opponent,
            position: s.position,
            overall_grade: s.overallGrade,
            letter_grade: s.letterGrade,
            youtube_url: s.youtubeUrl,
            stats: s.stats,
            feedback: s.feedback,
            team_name: s.teamName,
            player_name: s.playerName,
            age: s.age,
          });
        }
        localStorage.removeItem('legend_sessions');
      }

      // Sync coach reports
      const localReports = localStorage.getItem('legend_coach_reports');
      if (localReports) {
        const reports = JSON.parse(localReports);
        for (const r of reports) {
          await supabase.from('coach_reports').insert({
            user_id: userId,
            date: r.date,
            team_name: r.teamName,
            opponent: r.opponent,
            game_type: r.gameType,
            youtube_url: r.youtubeUrl,
            report: r.report,
            coach_notes: r.coachNotes,
          });
        }
        localStorage.removeItem('legend_coach_reports');
      }

      // Clean up other localStorage items
      localStorage.removeItem('legend_team_name');
      localStorage.removeItem('legend_email');
      localStorage.removeItem('legend_logged_in');
    } catch (err) {
      console.error('Error syncing localStorage to DB:', err);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        const profile = await fetchUserProfile(s.user);
        setUser(profile);
        // Sync any localStorage data
        await syncLocalStorageToDb(s.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      if (s?.user) {
        const profile = await fetchUserProfile(s.user);
        setUser(profile);
        if (event === 'SIGNED_IN') {
          await syncLocalStorageToDb(s.user.id);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile, syncLocalStorageToDb]);

  const signUp = async (email: string, password: string, role: 'player' | 'coach') => {
    // Store role in localStorage so it's available after signup
    localStorage.setItem('legend_role', role);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    // If user is confirmed immediately (no email verification)
    if (data.user && data.session) {
      // Create user profile with role
      await supabase.from('user_profiles').insert({
        user_id: data.user.id,
        email: data.user.email,
        role,
        display_name: email.split('@')[0],
      });

      const profile: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        role,
      };
      setUser(profile);
      setSession(data.session);
      await syncLocalStorageToDb(data.user.id);
    }

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      const profile = await fetchUserProfile(data.user);
      setUser(profile);
      setSession(data.session);
      await syncLocalStorageToDb(data.user.id);
      return { error: null, role: profile?.role };
    }

    return { error: 'Login failed' };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    // Clear any remaining localStorage
    localStorage.removeItem('legend_role');
    localStorage.removeItem('legend_email');
    localStorage.removeItem('legend_logged_in');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        isCoach: user?.role === 'coach',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
