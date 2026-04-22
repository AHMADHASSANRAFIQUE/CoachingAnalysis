import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPlayerProfiles, getGameSessions, getTeamName, setTeamName as saveTeamName, type PlayerProfile, type GameSession } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [teamName, setTeamNameState] = useState(getTeamName() || '');
  const [editingTeam, setEditingTeam] = useState(false);
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [p, s] = await Promise.all([getPlayerProfiles(), getGameSessions()]);
        setProfiles(p);
        setSessions(s);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  const handleTeamSave = () => {
    saveTeamName(teamName);
    setEditingTeam(false);
  };

  const getGradeValue = (grade: string) => {
    const map: Record<string, number> = { 'A+': 97, 'A': 95, 'A-': 92, 'B+': 88, 'B': 85, 'B-': 82, 'C+': 78, 'C': 75, 'C-': 72, 'D': 65, 'F': 50 };
    return map[grade] || 80;
  };

  const avgTeamGrade = sessions.length > 0
    ? (sessions.reduce((sum, s) => sum + getGradeValue(s.letterGrade), 0) / sessions.length).toFixed(0)
    : '--';

  const topPerformer = sessions.length > 0
    ? sessions.reduce((best, s) => getGradeValue(s.letterGrade) > getGradeValue(best.letterGrade) ? s : best, sessions[0])
    : null;

  const positionGroups = ['QB', 'WR', 'RB', 'OL', 'DL', 'LB', 'DB'];

  const getPositionData = (pos: string) => {
    const posPlayers = profiles.filter(p => p.position === pos);
    const posSessions = sessions.filter(s => s.position === pos);
    const avgGrade = posSessions.length > 0
      ? (posSessions.reduce((sum, s) => sum + getGradeValue(s.letterGrade), 0) / posSessions.length).toFixed(0)
      : '--';
    return { players: posPlayers.length, sessions: posSessions.length, avgGrade };
  };

  const recentSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const leaderboard = [...sessions]
    .sort((a, b) => getGradeValue(b.letterGrade) - getGradeValue(a.letterGrade))
    .slice(0, 5);

  if (loadingData) {
    return (
      <div className="font-lexend min-h-screen pt-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#333] border-t-[#CDFD51] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#999] text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-lexend min-h-screen pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Team Dashboard</h1>
            <div className="flex items-center gap-2 mt-2">
              {editingTeam ? (
                <div className="flex items-center gap-2">
                  <input
                    value={teamName}
                    onChange={e => setTeamNameState(e.target.value)}
                    className="bg-[#2a2a2a] border border-[#444] rounded px-3 py-1 text-white text-sm focus:border-[#CDFD51] focus:outline-none"
                    autoFocus
                  />
                  <button onClick={handleTeamSave} className="text-[#CDFD51] text-sm font-medium">Save</button>
                </div>
              ) : (
                <button onClick={() => setEditingTeam(true)} className="text-[#999] text-sm hover:text-[#CDFD51] transition-colors flex items-center gap-1">
                  {teamName || 'Set Team Name'}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#CDFD51]/10 rounded-full border border-[#CDFD51]/20">
              <div className="w-2 h-2 rounded-full bg-[#CDFD51]" />
              <span className="text-[#CDFD51] text-xs font-semibold">Synced</span>
            </div>
          )}
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#2a2a2a] rounded-xl border border-[#333] p-6">
            <div className="text-[#999] text-xs mb-1">Total Players Tracked</div>
            <div className="text-3xl font-bold text-white">{profiles.length}</div>
          </div>
          <div className="bg-[#2a2a2a] rounded-xl border border-[#333] p-6">
            <div className="text-[#999] text-xs mb-1">Games Analyzed</div>
            <div className="text-3xl font-bold text-white">{sessions.length}</div>
          </div>
          <div className="bg-[#2a2a2a] rounded-xl border border-[#333] p-6">
            <div className="text-[#999] text-xs mb-1">Avg Team Grade</div>
            <div className="text-3xl font-bold text-[#CDFD51]">{avgTeamGrade}</div>
          </div>
          <div className="bg-[#2a2a2a] rounded-xl border border-[#333] p-6">
            <div className="text-[#999] text-xs mb-1">Top Performer</div>
            <div className="text-lg font-bold text-white truncate">{topPerformer?.playerName || '--'}</div>
            {topPerformer && <div className="text-[#CDFD51] text-xs mt-1">{topPerformer.letterGrade} - {topPerformer.position}</div>}
          </div>
        </div>

        {/* Position Group Health */}
        <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Position Group Health</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {positionGroups.map(pos => {
              const data = getPositionData(pos);
              return (
                <div key={pos} className="bg-[#1a1a1a] rounded-xl p-4 text-center">
                  <div className="text-[#CDFD51] font-bold text-lg mb-2">{pos}</div>
                  <div className="text-white text-sm font-medium">{data.players} players</div>
                  <div className="text-[#999] text-xs mt-1">Avg: {data.avgGrade}</div>
                  <div className="text-[#666] text-xs">{data.sessions} sessions</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sessions */}
          <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
            <h2 className="text-lg font-bold text-white mb-4">Recent Film Sessions</h2>
            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#666] text-sm mb-4">No film sessions yet</p>
                <Link to="/film-analysis" className="text-[#CDFD51] text-sm font-semibold hover:underline">
                  Start your first analysis
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[#666] text-xs">{s.date}</span>
                      <span className="text-white text-sm font-medium">{s.playerName}</span>
                      <span className="px-2 py-0.5 bg-[#CDFD51]/10 text-[#CDFD51] rounded text-xs">{s.position}</span>
                    </div>
                    <span className="text-white font-bold text-sm">{s.letterGrade}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard */}
          <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
            <h2 className="text-lg font-bold text-white mb-4">Top Performers</h2>
            {leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#666] text-sm">Analyze games to see top performers</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-4 bg-[#1a1a1a] rounded-lg p-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-[#CDFD51] text-[#1a1a1a]' :
                      i === 1 ? 'bg-[#999] text-[#1a1a1a]' :
                      'bg-[#555] text-white'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm">{s.playerName}</div>
                      <div className="text-[#666] text-xs">{s.position} - {s.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#CDFD51] font-bold">{s.letterGrade}</div>
                      <div className={`text-xs ${
                        s.overallGrade === 'ELITE' ? 'text-[#CDFD51]' :
                        s.overallGrade === 'DEVELOPING' ? 'text-yellow-400' : 'text-red-400'
                      }`}>{s.overallGrade}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Trends */}
        {sessions.length > 2 && (
          <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6 mt-8">
            <h2 className="text-lg font-bold text-white mb-4">Team Trends Over Season</h2>
            <div className="flex items-end gap-1 h-32">
              {sessions.slice(-15).map((s) => {
                const val = getGradeValue(s.letterGrade);
                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-[#CDFD51]/30 rounded-t transition-all hover:bg-[#CDFD51]/50"
                      style={{ height: `${(val / 100) * 100}px` }}
                      title={`${s.playerName}: ${s.letterGrade}`}
                    />
                    <span className="text-[#666] text-[8px] truncate w-full text-center">{s.playerName?.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
