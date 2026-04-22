import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getPlayerProfiles, savePlayerProfile, getGameSessions,
  clearSeasonData, generateId, getTeamName,
  type PlayerProfile as PlayerProfileType, type GameSession
} from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

const GradeBadge: React.FC<{ grade: string }> = ({ grade }) => {
  const colors: Record<string, string> = {
    'ELITE': 'bg-[#CDFD51]/20 text-[#CDFD51] border-[#CDFD51]/30',
    'DEVELOPING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'NEEDS CONSISTENCY': 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors[grade] || colors['DEVELOPING']}`}>
      {grade}
    </span>
  );
};

const PlayerProfile: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<PlayerProfileType[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PlayerProfileType | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Change #4: Team Name State
  const [teamName, setTeamNameState] = useState(() => {
    return localStorage.getItem('legend_team_name') || 'My Team';
  });

  const saveTeamName = (name: string) => {
    setTeamNameState(name);
    localStorage.setItem('legend_team_name', name);
  };

  // Game History & Benchmarks - Persistent Storage
  const [gameHistory, setGameHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('legend_game_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [benchmarks, setBenchmarks] = useState<any>(() => {
    const saved = localStorage.getItem('legend_benchmarks');
    return saved ? JSON.parse(saved) : null;
  });

  // Form state
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState('QB');
  const [formJersey, setFormJersey] = useState('');
  const [formTeam, setFormTeam] = useState(getTeamName() || '');
  const [formAge, setFormAge] = useState('');
  const [formSeason, setFormSeason] = useState('2026');

  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const p = await getPlayerProfiles();
        setProfiles(p);
        if (p.length > 0 && !selectedProfile) {
          setSelectedProfile(p[0]);
        }
      } catch (err) {
        console.error('Error loading profiles:', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadSessions = async () => {
      if (selectedProfile) {
        const allSessions = await getGameSessions();
        const playerSessions = allSessions.filter(
          s => s.playerName === selectedProfile.name && s.position === selectedProfile.position
        );
        setSessions(playerSessions);
      }
    };
    loadSessions();
  }, [selectedProfile]);

  const createProfile = async () => {
    if (!formName) return;
    const profile: PlayerProfileType = {
      id: generateId(),
      name: formName,
      position: formPosition,
      jerseyNumber: formJersey,
      teamName: formTeam,
      age: formAge,
      seasonYear: formSeason,
      createdAt: new Date().toISOString(),
    };
    const saved = await savePlayerProfile(profile);
    const updated = await getPlayerProfiles();
    setProfiles(updated);
    setSelectedProfile(saved || profile);
    setShowForm(false);
    setFormName(''); setFormJersey(''); setFormAge('');
  };

  const getSeasonStats = () => {
    if (!sessions.length) return null;
    const totals: Record<string, number> = {};
    sessions.forEach(s => {
      Object.entries(s.stats || {}).forEach(([key, val]) => {
        totals[key] = (totals[key] || 0) + (val || 0);
      });
    });
    const games = sessions.length;
    return { totals, games, averages: Object.fromEntries(
      Object.entries(totals).map(([k, v]) => [k, games > 0 ? (v / games).toFixed(1) : 0])
    )};
  };

  const getGradeValue = (grade: string) => {
    const map: Record<string, number> = { 'A+': 97, 'A': 95, 'A-': 92, 'B+': 88, 'B': 85, 'B-': 82, 'C+': 78, 'C': 75, 'C-': 72, 'D': 65, 'F': 50 };
    return map[grade] || 80;
  };

  const seasonStats = getSeasonStats();

  const getPositionStatLabels = (pos: string) => {
    switch (pos) {
      case 'QB': return [
        { key: 'passingYards', label: 'Total Passing Yards' },
        { key: 'rushingYards', label: 'Total Rushing Yards' },
        { key: 'tds', label: 'Total TDs' },
        { key: 'ints', label: 'Total INTs' },
      ];
      case 'WR': case 'TE': return [
        { key: 'receptions', label: 'Total Receptions' },
        { key: 'receivingYards', label: 'Total Receiving Yards' },
        { key: 'tds', label: 'Total TDs' },
      ];
      case 'RB': return [
        { key: 'rushingYards', label: 'Total Rushing Yards' },
        { key: 'rushingAttempts', label: 'Total Carries' },
        { key: 'tds', label: 'Total TDs' },
      ];
      default: return [
        { key: 'tackles', label: 'Total Tackles' },
        { key: 'positionGrade', label: 'Avg Grade' },
      ];
    }
  };

  const handleClearSeason = async () => {
    await clearSeasonData();
    setSessions([]);
    setConfirmClear(false);
  };

  if (loadingData) {
    return (
      <div className="font-lexend min-h-screen pt-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#333] border-t-[#CDFD51] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#999] text-sm">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-lexend min-h-screen pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Player Profile</h1>
            <p className="text-[#999] text-sm mt-1">
              Track player development across the season
              {user && <span className="text-[#CDFD51]"> &middot; Data synced to database</span>}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#CDFD51] text-[#1a1a1a] font-semibold text-sm rounded-lg hover:bg-[#b8e845] transition-colors"
          >
            + New Profile
          </button>
        </div>

        {/* Profile Selector */}
        {profiles.length > 0 && (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProfile(p)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedProfile?.id === p.id
                    ? 'bg-[#CDFD51] text-[#1a1a1a]'
                    : 'bg-[#2a2a2a] text-[#999] hover:text-white border border-[#333]'
                }`}
              >
                {p.name} - {p.position}
              </button>
            ))}
          </div>
        )}

        {/* Create Profile Form */}
        {(showForm || profiles.length === 0) && (
          <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-8 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">Create Player Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#999] text-xs mb-1">Player Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Full name" className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[#999] text-xs mb-1">Position</label>
                <select value={formPosition} onChange={e => setFormPosition(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm focus:border-[#CDFD51] focus:outline-none">
                  {['QB','WR','RB','TE','OL','DL','LB','DB','K/P'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[#999] text-xs mb-1">Jersey Number</label>
                <input value={formJersey} onChange={e => setFormJersey(e.target.value)} placeholder="#" className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[#999] text-xs mb-1">Team Name</label>
                <input value={formTeam} onChange={e => setFormTeam(e.target.value)} placeholder="Team name" className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[#999] text-xs mb-1">Age / Grade Level</label>
                <input value={formAge} onChange={e => setFormAge(e.target.value)} placeholder="e.g. 14 / 9th grade" className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none" />
              </div>
              <div>
                <label className="block text-[#999] text-xs mb-1">Season Year</label>
                <input value={formSeason} onChange={e => setFormSeason(e.target.value)} placeholder="2026" className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={createProfile} className="px-6 py-3 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-colors">
                Create Profile
              </button>
              {profiles.length > 0 && (
                <button onClick={() => setShowForm(false)} className="px-6 py-3 border border-[#555] text-white text-sm rounded-lg hover:border-[#CDFD51] transition-colors">
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* Profile Display */}
        {selectedProfile && !showForm && (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-[#CDFD51]/10 flex items-center justify-center">
                  <span className="text-[#CDFD51] text-3xl font-black">#{selectedProfile.jerseyNumber || '?'}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{selectedProfile.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="px-3 py-1 bg-[#CDFD51]/20 text-[#CDFD51] rounded-full text-xs font-bold">{selectedProfile.position}</span>
                    <span className="text-[#999] text-sm">{selectedProfile.teamName}</span>
                    <span className="text-[#666] text-sm">{selectedProfile.age}</span>
                    <span className="text-[#666] text-sm">Season {selectedProfile.seasonYear}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-white">{sessions.length}</div>
                  <div className="text-[#666] text-xs">Games Analyzed</div>
                </div>
              </div>
            </div>

            {/* Season Stats */}
            {seasonStats && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                <h3 className="text-lg font-bold text-white mb-4">Season Stats Dashboard</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {getPositionStatLabels(selectedProfile.position).map(s => (
                    <div key={s.key} className="bg-[#1a1a1a] rounded-xl p-4">
                      <div className="text-[#999] text-xs mb-1">{s.label}</div>
                      <div className="text-white text-2xl font-bold">{seasonStats.totals[s.key] || 0}</div>
                      <div className="text-[#666] text-xs mt-1">Avg: {seasonStats.averages[s.key] || 0}/game</div>
                    </div>
                  ))}
                  {selectedProfile.position === 'QB' && seasonStats.totals.attempts > 0 && (
                    <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#CDFD51]/20">
                      <div className="text-[#CDFD51] text-xs mb-1">Completion %</div>
                      <div className="text-[#CDFD51] text-2xl font-bold">
                        {((seasonStats.totals.completions / seasonStats.totals.attempts) * 100).toFixed(1)}%
                      </div>
                      <div className="text-[#666] text-xs mt-1">
                        {seasonStats.totals.completions}/{seasonStats.totals.attempts}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Trend */}
            {sessions.length > 0 && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                <h3 className="text-lg font-bold text-white mb-4">Performance Trend</h3>
                <div className="flex items-end gap-2 h-40">
                  {sessions.slice(-5).map((s, i, arr) => {
                    const val = getGradeValue(s.letterGrade);
                    const prev = i > 0 ? getGradeValue(arr[i - 1].letterGrade) : val;
                    const trend = val - prev;
                    return (
                      <div key={s.id} className="flex-1 flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1">
                          {trend > 0 && <svg className="w-3 h-3 text-[#CDFD51]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>}
                          {trend < 0 && <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>}
                          <span className="text-xs text-[#999]">{s.letterGrade}</span>
                        </div>
                        <div
                          className="w-full bg-[#CDFD51]/20 rounded-t-lg transition-all"
                          style={{ height: `${(val / 100) * 120}px` }}
                        >
                          <div className="w-full h-full bg-[#CDFD51]/40 rounded-t-lg" />
                        </div>
                        <span className="text-[#666] text-[10px]">G{sessions.indexOf(s) + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Game History */}
            <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
              <h3 className="text-lg font-bold text-white mb-4">Game History Log</h3>
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[#666] text-sm mb-4">No games analyzed yet</p>
                  <Link to="/film-analysis" className="text-[#CDFD51] text-sm font-semibold hover:underline">
                    Analyze your first film session
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s, i) => {
                    const prev = i > 0 ? sessions[i - 1] : null;
                    const prevGrade = prev ? getGradeValue(prev.letterGrade) : null;
                    const currGrade = getGradeValue(s.letterGrade);
                    const change = prevGrade ? ((currGrade - prevGrade) / prevGrade * 100).toFixed(1) : null;

                    return (
                      <div key={s.id}>
                        <button
                          onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                          className="w-full bg-[#1a1a1a] rounded-lg p-4 text-left hover:bg-[#222] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-[#999] text-xs">{s.date}</span>
                              <span className="text-white text-sm font-medium">{s.opponent || 'Film Session'}</span>
                              <span className="px-2 py-0.5 bg-[#CDFD51]/10 text-[#CDFD51] rounded text-xs">{s.position}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <GradeBadge grade={s.overallGrade} />
                              <span className="text-white font-bold text-sm">{s.letterGrade}</span>
                              {change && (
                                <span className={`text-xs ${parseFloat(change) >= 0 ? 'text-[#CDFD51]' : 'text-red-400'}`}>
                                  {parseFloat(change) >= 0 ? '+' : ''}{change}%
                                </span>
                              )}
                              <svg className={`w-4 h-4 text-[#666] transition-transform ${expandedSession === s.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </button>
                        {expandedSession === s.id && (
                          <div className="bg-[#1a1a1a] rounded-b-lg p-4 border-t border-[#333] -mt-1">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                              {Object.entries(s.stats || {}).filter(([_, v]) => v > 0).map(([k, v]) => (
                                <div key={k} className="text-center">
                                  <div className="text-white font-bold">{v}</div>
                                  <div className="text-[#666] text-xs capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</div>
                                </div>
                              ))}
                            </div>
                            {s.feedback?.overview && (
                              <p className="text-[#999] text-xs leading-relaxed">{s.feedback.overview.substring(0, 300)}...</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Benchmark Comparisons */}
            {sessions.length > 0 && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                <h3 className="text-lg font-bold text-white mb-2">Benchmark Comparisons</h3>
                <p className="text-[#666] text-xs mb-6">How does {selectedProfile.name} compare? (Age-appropriate benchmarks for {selectedProfile.age})</p>
                <div className="space-y-4">
                  {[
                    { label: 'Same Team Players', pct: 72 },
                    { label: `Same Age/Grade State Average`, pct: 68 },
                    { label: 'Elite Players Same Age', pct: 55 },
                  ].map(b => (
                    <div key={b.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-[#999] text-xs">{b.label}</span>
                        <span className="text-white text-xs font-bold">{b.pct}th percentile</span>
                      </div>
                      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className="h-full bg-[#CDFD51] rounded-full transition-all" style={{ width: `${b.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Game-to-Game Comparison (Change #1) */}
            {gameHistory.length > 1 && (
              <div style={{
                background: '#1a1a1a', border: '1px solid #39FF14',
                borderRadius: '12px', padding: '20px', marginTop: '20px'
              }}>
                <h3 style={{ color: '#39FF14', marginBottom: '16px' }}>
                  Game-to-Game Comparison
                </h3>
                <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #333' }}>
                      <th style={{ textAlign: 'left', padding: '8px', color: '#888' }}>Metric</th>
                      <th style={{ textAlign: 'center', padding: '8px', color: '#39FF14' }}>This Game</th>
                      <th style={{ textAlign: 'center', padding: '8px', color: '#888' }}>Last Game</th>
                      <th style={{ textAlign: 'center', padding: '8px', color: '#888' }}>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Passing Yards', key: 'passingYards' },
                      { label: 'Rushing Yards', key: 'rushingYards' },
                      { label: 'Completion %', key: 'completionPct' },
                      { label: 'Touchdowns', key: 'touchdowns' },
                      { label: 'Interceptions', key: 'interceptions' },
                    ].map(({ label, key }) => {
                      const current = gameHistory[0]?.stats[key] || 0;
                      const previous = gameHistory[1]?.stats[key] || 0;
                      const improved = key === 'interceptions' ? current <= previous : current >= previous;
                      return (
                        <tr key={key} style={{ borderBottom: '1px solid #222' }}>
                          <td style={{ padding: '8px', color: '#ccc' }}>{label}</td>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#fff', fontWeight: 'bold' }}>{current}</td>
                          <td style={{ padding: '8px', textAlign: 'center', color: '#888' }}>{previous}</td>
                          <td style={{ padding: '8px', textAlign: 'center', fontSize: '20px' }}>
                            {current === previous ? '➡️' : improved ? '📈' : '📉'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <h4 style={{ color: '#888', marginTop: '16px', marginBottom: '8px' }}>Game History</h4>
                {gameHistory.map((game) => (
                  <div key={game.id} style={{
                    background: '#111', borderRadius: '8px', padding: '10px 14px',
                    marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ color: '#888', fontSize: '13px' }}>{game.date}</span>
                    <span style={{ color: '#fff', fontSize: '13px' }}>
                      {game.stats.passingYards} Pass Yds · {game.stats.rushingYards} Rush Yds · {game.stats.completionPct}% Comp
                    </span>
                    <span style={{
                      color: game.overallGrade === 'ELITE' ? '#39FF14' : game.overallGrade === 'DEVELOPING' ? '#FFD700' : '#FF6B6B',
                      fontWeight: 'bold', fontSize: '12px'
                    }}>
                      {game.overallGrade}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Change #4: Team Name Settings (Injecting before Clear Season Data) */}
            <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  TEAM NAME
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" placeholder="e.g. Riverside Panthers"
                    value={teamName}
                    onChange={(e) => setTeamNameState(e.target.value)}
                    style={{ flex: 1, background: '#111', border: '1px solid #333',
                    borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '16px' }}
                  />
                  <button onClick={() => saveTeamName(teamName)}
                    style={{ background: '#39FF14', color: '#000', border: 'none',
                    borderRadius: '8px', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}>
                    SAVE
                  </button>
                </div>
              </div>
            </div>

            {/* Clear Season Data */}
            <div className="flex justify-end">
              {!confirmClear ? (
                <button onClick={() => setConfirmClear(true)} className="text-red-400 text-xs hover:underline">
                  Clear Season Data
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-red-400 text-xs">Are you sure? This cannot be undone.</span>
                  <button onClick={handleClearSeason} className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                    Yes, Clear
                  </button>
                  <button onClick={() => setConfirmClear(false)} className="px-3 py-1 bg-[#333] text-white rounded text-xs">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerProfile;
