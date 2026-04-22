// Storage utility functions for LEGEND app
// Uses Supabase DB when authenticated, localStorage as fallback

import { supabase } from '@/lib/supabase';

export interface PlayerProfile {
  id: string;
  name: string;
  position: string;
  jerseyNumber: string;
  teamName: string;
  age: string;
  seasonYear: string;
  createdAt: string;
}

export interface PlayerStatBenchmarks {
  passingYards: number;
  rushingYards: number;
  completions: number;
  attempts: number;
  touchdowns: number;
  interceptions: number;
  completionPct: string;
}

export interface GameSession {
  id: string;
  playerId: string;
  date: string;
  opponent: string;
  position: string;
  overallGrade: string;
  letterGrade: string;
  youtubeUrl: string;
  stats: Record<string, number>;
  feedback: any;
  teamName: string;
  playerName: string;
  age: string;
}

export interface GameHistoryEntry {
  id: number;
  date: string;
  playerName: string;
  jerseyNumber: string;
  position: string;
  stats: any;
  overallGrade: string;
}

export interface CoachGameReport {
  id: string;
  date: string;
  teamName: string;
  opponent: string;
  gameType: string;
  youtubeUrl: string;
  report: any;
  coachNotes: string;
  createdAt: string;
}

// Helper to get current user ID
const getCurrentUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
};

// ============ Player Profiles ============

export const getPlayerProfiles = async (): Promise<PlayerProfile[]> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    const data = localStorage.getItem('legend_players');
    return data ? JSON.parse(data) : [];
  }

  const { data, error } = await supabase
    .from('player_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching player profiles:', error);
    return [];
  }

  return (data || []).map(p => ({
    id: p.id,
    name: p.name,
    position: p.position,
    jerseyNumber: p.jersey_number || '',
    teamName: p.team_name || '',
    age: p.age || '',
    seasonYear: p.season_year || '',
    createdAt: p.created_at,
  }));
};

export const savePlayerProfile = async (profile: PlayerProfile): Promise<PlayerProfile | null> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    // Fallback to localStorage
    const profiles = JSON.parse(localStorage.getItem('legend_players') || '[]');
    const idx = profiles.findIndex((p: any) => p.id === profile.id);
    if (idx >= 0) profiles[idx] = profile;
    else profiles.push(profile);
    localStorage.setItem('legend_players', JSON.stringify(profiles));
    return profile;
  }

  const payload = {
    user_id: userId,
    name: profile.name,
    position: profile.position,
    jersey_number: profile.jerseyNumber,
    team_name: profile.teamName,
    age: profile.age,
    season_year: profile.seasonYear,
  };

  // Check if this is an update or insert
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id);
  
  if (isUUID) {
    const { data, error } = await supabase
      .from('player_profiles')
      .upsert({ id: profile.id, ...payload })
      .select()
      .single();
    
    if (error) {
      console.error('Error saving player profile:', error);
      return null;
    }
    return data ? { ...profile, id: data.id } : null;
  } else {
    const { data, error } = await supabase
      .from('player_profiles')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating player profile:', error);
      return null;
    }
    return data ? {
      id: data.id,
      name: data.name,
      position: data.position,
      jerseyNumber: data.jersey_number || '',
      teamName: data.team_name || '',
      age: data.age || '',
      seasonYear: data.season_year || '',
      createdAt: data.created_at,
    } : null;
  }
};

export const getPlayerById = async (id: string): Promise<PlayerProfile | undefined> => {
  const profiles = await getPlayerProfiles();
  return profiles.find(p => p.id === id);
};

// ============ Game Sessions ============

export const getGameSessions = async (): Promise<GameSession[]> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    const data = localStorage.getItem('legend_sessions');
    return data ? JSON.parse(data) : [];
  }

  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching game sessions:', error);
    return [];
  }

  return (data || []).map(s => ({
    id: s.id,
    playerId: s.player_id || '',
    date: s.date || '',
    opponent: s.opponent || '',
    position: s.position || '',
    overallGrade: s.overall_grade || '',
    letterGrade: s.letter_grade || '',
    youtubeUrl: s.youtube_url || '',
    stats: s.stats || {},
    feedback: s.feedback || {},
    teamName: s.team_name || '',
    playerName: s.player_name || '',
    age: s.age || '',
  }));
};

export const getPlayerSessions = async (playerId: string): Promise<GameSession[]> => {
  const sessions = await getGameSessions();
  return sessions.filter(s => s.playerId === playerId);
};

export const saveGameSession = async (session: GameSession): Promise<GameSession | null> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    const sessions = JSON.parse(localStorage.getItem('legend_sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('legend_sessions', JSON.stringify(sessions));
    return session;
  }

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      user_id: userId,
      player_id: session.playerId || null,
      date: session.date,
      opponent: session.opponent,
      position: session.position,
      overall_grade: session.overallGrade,
      letter_grade: session.letterGrade,
      youtube_url: session.youtubeUrl,
      stats: session.stats,
      feedback: session.feedback,
      team_name: session.teamName,
      player_name: session.playerName,
      age: session.age,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving game session:', error);
    return null;
  }

  return data ? { ...session, id: data.id } : null;
};

// ============ Coach Reports ============

export const getCoachReports = async (): Promise<CoachGameReport[]> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    const data = localStorage.getItem('legend_coach_reports');
    return data ? JSON.parse(data) : [];
  }

  const { data, error } = await supabase
    .from('coach_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coach reports:', error);
    return [];
  }

  return (data || []).map(r => ({
    id: r.id,
    date: r.date || '',
    teamName: r.team_name || '',
    opponent: r.opponent || '',
    gameType: r.game_type || '',
    youtubeUrl: r.youtube_url || '',
    report: r.report || {},
    coachNotes: r.coach_notes || '',
    createdAt: r.created_at,
  }));
};

export const saveCoachReport = async (report: CoachGameReport): Promise<CoachGameReport | null> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    const reports = JSON.parse(localStorage.getItem('legend_coach_reports') || '[]');
    reports.push(report);
    localStorage.setItem('legend_coach_reports', JSON.stringify(reports));
    return report;
  }

  const { data, error } = await supabase
    .from('coach_reports')
    .insert({
      user_id: userId,
      date: report.date,
      team_name: report.teamName,
      opponent: report.opponent,
      game_type: report.gameType,
      youtube_url: report.youtubeUrl,
      report: report.report,
      coach_notes: report.coachNotes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving coach report:', error);
    return null;
  }

  return data ? { ...report, id: data.id } : null;
};

// ============ Shared Reports ============

export const createSharedReport = async (
  reportType: 'film_analysis' | 'coach_report',
  reportData: any,
  expiresIn: '24h' | '7d' | 'permanent'
): Promise<string | null> => {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  let expiresAt: string | null = null;
  if (expiresIn === '24h') {
    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  } else if (expiresIn === '7d') {
    expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  const { data, error } = await supabase
    .from('shared_reports')
    .insert({
      report_type: reportType,
      report_data: reportData,
      created_by: userId,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating shared report:', error);
    return null;
  }

  return data?.id || null;
};

export const getSharedReport = async (id: string): Promise<{
  reportType: string;
  reportData: any;
  createdAt: string;
  expiresAt: string | null;
  expired: boolean;
} | null> => {
  const { data, error } = await supabase
    .from('shared_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching shared report:', error);
    return null;
  }

  const expired = data.expires_at ? new Date(data.expires_at) < new Date() : false;

  return {
    reportType: data.report_type,
    reportData: data.report_data,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    expired,
  };
};

// ============ Team Name ============

export const getTeamName = (): string => {
  return localStorage.getItem('legend_team_name') || '';
};

export const setTeamName = (name: string): void => {
  localStorage.setItem('legend_team_name', name);
};

// ============ User Role (localStorage fallback) ============

export const getUserRole = (): string => {
  return localStorage.getItem('legend_role') || '';
};

export const setUserRole = (role: string): void => {
  localStorage.setItem('legend_role', role);
};

// ============ Utilities ============

export const generateId = (): string => {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const clearSeasonData = async (): Promise<void> => {
  const userId = await getCurrentUserId();
  if (userId) {
    await supabase.from('game_sessions').delete().eq('user_id', userId);
  }
  localStorage.removeItem('legend_sessions');
};

// ============ Game History Persistence (Change #1) ============

export const getLocalGameHistory = (): GameHistoryEntry[] => {
  try {
    const saved = localStorage.getItem('legend_game_history');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error('Error parsing game history:', e);
    return [];
  }
};

export const saveLocalGameHistory = (history: GameHistoryEntry[]): void => {
  localStorage.setItem('legend_game_history', JSON.stringify(history.slice(0, 20)));
};

export const getLocalBenchmarks = (): PlayerStatBenchmarks | null => {
  try {
    const saved = localStorage.getItem('legend_benchmarks');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Error parsing benchmarks:', e);
    return null;
  }
};

export const saveLocalBenchmarks = (benchmarks: PlayerStatBenchmarks): void => {
  localStorage.setItem('legend_benchmarks', JSON.stringify(benchmarks));
};
