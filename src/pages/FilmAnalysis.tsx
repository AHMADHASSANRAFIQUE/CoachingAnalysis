import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { saveGameSession, getPlayerProfiles, generateId, getTeamName, getLocalGameHistory, saveLocalGameHistory, getLocalBenchmarks, saveLocalBenchmarks, GameHistoryEntry } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import ShareReportModal from '@/components/ShareReportModal';

interface PlayerTag {
  id: string;
  jersey: string;
  startTime: string;
  descriptors: string;
  label: string;
}

const POSITIONS = ['QB', 'WR', 'RB', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'];

const GradeBadge: React.FC<{ grade: string }> = ({ grade }) => {
  const colors: Record<string, string> = {
    'ELITE': 'bg-[#CDFD51]/20 text-[#CDFD51] border-[#CDFD51]/30',
    'DEVELOPING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'NEEDS CONSISTENCY': 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${colors[grade] || colors['DEVELOPING']}`}>
      {grade}
    </span>
  );
};

const FilmAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [position, setPosition] = useState('QB');
  const [teamName, setTeamNameState] = useState(getTeamName() || '');
  const [playerName, setPlayerName] = useState('');
  const [age, setAge] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [startTime, setStartTime] = useState('');
  const [descriptors, setDescriptors] = useState('');
  const [tagLabel, setTagLabel] = useState('');
  const [playerTags, setPlayerTags] = useState<PlayerTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Change #2: Real QB Metrics
  const [qbStats, setQbStats] = useState({
    passingYards: '', rushingYards: '', completions: '',
    attempts: '', touchdowns: '', interceptions: '',
  });

  // Change #1: Game Memory Integration - Professional Storage
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>(() => getLocalGameHistory());
  const [benchmarks, setBenchmarks] = useState<any>(() => getLocalBenchmarks());

  const saveGameToHistory = (gameData: any) => {
    const newGame: GameHistoryEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      playerName: playerName || 'Player',
      jerseyNumber: playerTags[0]?.jersey || jerseyNumber || '00',
      position: position || 'QB',
      stats: {
        passingYards: parseInt(qbStats.passingYards) || 0,
        rushingYards: parseInt(qbStats.rushingYards) || 0,
        completions: parseInt(qbStats.completions) || 0,
        attempts: parseInt(qbStats.attempts) || 0,
        touchdowns: parseInt(qbStats.touchdowns) || 0,
        interceptions: parseInt(qbStats.interceptions) || 0,
        completionPct: parseInt(qbStats.attempts) > 0
          ? ((parseInt(qbStats.completions) / parseInt(qbStats.attempts)) * 100).toFixed(1)
          : '0.0',
      },
      overallGrade: gameData.overallGrade || 'DEVELOPING',
    };
    
    const updatedHistory = [newGame, ...gameHistory].slice(0, 20);
    setGameHistory(updatedHistory);
    saveLocalGameHistory(updatedHistory);
    
    if (!benchmarks) {
      setBenchmarks(newGame.stats);
      saveLocalBenchmarks(newGame.stats);
    }
  };

  const buildGeminiPrompt = (playerInfo: any, qbStats: any) => {
    const base = `You are an elite SEC head football coach with 25+ years of experience.
You speak directly, use motivational language, and provide ADVANCED position-specific feedback.
Player: ${playerInfo.name}, #${playerInfo.jersey}, Team: ${playerInfo.teamName}
Age/Level: ${playerInfo.ageLevel}
Description for film identification: ${playerInfo.description}
IMPORTANT: Compare ONLY to age-appropriate (${playerInfo.ageLevel}) benchmarks. NOT NFL.`;

    const positions: Record<string, string> = {
      QB: `${base}
ANALYZE ONLY QUARTERBACK SKILLS:
1. Pre-Snap Reads & Mental Processing
2. Footwork & Throwing Mechanics
3. Pocket Presence & Mobility
4. Ball Placement, Velocity & Touch
5. Decision Making & Turnover Avoidance
6. Play Action / RPO Execution
7. Leadership & Huddle Presence

Stats: ${qbStats.passingYards} pass yds, ${qbStats.rushingYards} rush yds,
${qbStats.completions}/${qbStats.attempts} completions, ${qbStats.touchdowns} TDs, ${qbStats.interceptions} INTs

DO NOT mention route running, receiving, or any non-QB metrics.
Grade each: ELITE | DEVELOPING | NEEDS CONSISTENCY`,
      WR: `${base}
ANALYZE ONLY WIDE RECEIVER SKILLS:
Route Running, Release Packages, Ball Skills, Blocking, Separation, YAC
Grade each: ELITE | DEVELOPING | NEEDS CONSISTENCY`,
      RB: `${base}
ANALYZE ONLY RUNNING BACK SKILLS:
Vision & Patience, Burst, Pass Protection, Receiving, Ball Security, Contact Balance
Grade each: ELITE | DEVELOPING | NEEDS CONSISTENCY`,
      OL: `${base}
ANALYZE ONLY OFFENSIVE LINE SKILLS:
Pass Protection, Run Blocking, Footwork, Hand Technique, Communication, Finish
Grade each: ELITE | DEVELOPING | NEEDS CONSISTENCY`,
      DB: `${base}
ANALYZE ONLY DEFENSIVE BACK SKILLS:
Coverage, Press vs Zone, Ball Skills, Tackling, Positioning, Film Study
Grade each: ELITE | DEVELOPING | NEEDS CONSISTENCY`,
      LB: `${base}
ANALYZE ONLY LINEBACKER SKILLS:
Run Fits, Pass Coverage, Pass Rush, Instincts, Tackling, Leadership
Grade each: ELITE | DEVELOPING | NEEDS CONSISTENCY`,
    };

    return positions[playerInfo.position] || positions['QB'];
  };

  const addTag = () => {
    if (!jerseyNumber && !tagLabel) return;
    setPlayerTags([...playerTags, {
      id: generateId(),
      jersey: jerseyNumber,
      startTime,
      descriptors,
      label: tagLabel || `#${jerseyNumber}`,
    }]);
    setJerseyNumber('');
    setStartTime('');
    setDescriptors('');
    setTagLabel('');
  };

  const removeTag = (id: string) => {
    setPlayerTags(playerTags.filter(t => t.id !== id));
  };

  const analyzeFilm = async () => {
    if (!youtubeUrl) return;
    setLoading(true);
    setResults(null);
    setSaved(false);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('analyze-film', {
        body: {
          youtubeUrl,
          position,
          teamName,
          playerName,
          age,
          jerseyNumber: playerTags[0]?.jersey || jerseyNumber,
          startTime: playerTags[0]?.startTime || startTime,
          descriptors: playerTags.map(t => t.descriptors).join(', ') || descriptors,
          analysisType: 'player',
          customPrompt: buildGeminiPrompt({
            name: playerName,
            jersey: playerTags[0]?.jersey || jerseyNumber,
            teamName,
            ageLevel: age,
            position,
            description: playerTags.map(t => t.descriptors).join(', ') || descriptors
          }, qbStats)
        },
      });

      if (invokeError) {
        console.error('Supabase function error:', invokeError);
        let detail = '';
        try {
          const errorText = await invokeError.context?.text();
          detail = errorText || '';
        } catch (e) {}
        
        throw new Error(`AI Analysis failed: ${invokeError.message}. ${detail ? `Server says: ${detail}` : 'Check if GEMINI_API_KEY is set in Supabase Secrets.'}`);
      }

      if (data?.data) {
        setResults(data.data);
        if (data.data.suggestedStats) {
          setStats(data.data.suggestedStats);
        }
        // Change #1 integration
        saveGameToHistory(data.data);
      } else if (data?.analysis) {
        setResults({ analysis: data.analysis, overallGrade: data.overallGrade || 'DEVELOPING', letterGrade: data.letterGrade || 'B' });
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setResults({ error: err.message || 'Analysis failed' });
    } finally {
      setLoading(false);
    }
  };

  const saveToProfile = async () => {
    const profiles = await getPlayerProfiles();
    const playerId = profiles.find(p => p.name === playerName && p.position === position)?.id || '';
    
    const session = {
      id: generateId(),
      playerId,
      date: new Date().toISOString().split('T')[0],
      opponent: 'Film Session',
      position,
      overallGrade: results?.overallGrade || 'DEVELOPING',
      letterGrade: results?.letterGrade || 'B',
      youtubeUrl,
      stats,
      feedback: results,
      teamName,
      playerName,
      age,
    };
    await saveGameSession(session);
    setSaved(true);
  };

  const getShareData = () => ({
    playerName,
    position,
    teamName,
    age,
    youtubeUrl,
    stats,
    results,
  });

  const getPositionStats = () => {
    switch (position) {
      case 'QB':
        return [
          { key: 'passingYards', label: 'Passing Yards' },
          { key: 'rushingYards', label: 'Rushing Yards' },
          { key: 'completions', label: 'Completions' },
          { key: 'attempts', label: 'Attempts' },
          { key: 'tds', label: 'TDs' },
          { key: 'ints', label: 'INTs' },
        ];
      case 'WR': case 'TE':
        return [
          { key: 'targets', label: 'Targets' },
          { key: 'receptions', label: 'Receptions' },
          { key: 'receivingYards', label: 'Receiving Yards' },
          { key: 'tds', label: 'TDs' },
          { key: 'yac', label: 'YAC' },
        ];
      case 'RB':
        return [
          { key: 'rushingAttempts', label: 'Rushing Attempts' },
          { key: 'rushingYards', label: 'Rushing Yards' },
          { key: 'ypc', label: 'YPC' },
          { key: 'receptions', label: 'Receptions' },
          { key: 'tds', label: 'TDs' },
        ];
      case 'OL': case 'DL':
        return [
          { key: 'pancakeBlocks', label: 'Pancake Blocks' },
          { key: 'pressures', label: 'Pressures' },
          { key: 'runStopPct', label: 'Run Stop %' },
          { key: 'positionGrade', label: 'Grade' },
        ];
      case 'LB': case 'DB':
        return [
          { key: 'tackles', label: 'Tackles' },
          { key: 'tfls', label: 'TFLs' },
          { key: 'ints', label: 'INTs' },
          { key: 'pbus', label: 'PBUs' },
          { key: 'positionGrade', label: 'Grade' },
        ];
      default:
        return [{ key: 'positionGrade', label: 'Grade' }];
    }
  };

  const completionPct = position === 'QB' && stats.attempts > 0
    ? ((stats.completions / stats.attempts) * 100).toFixed(1)
    : null;

  return (
    <div className="font-lexend min-h-screen pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Input Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Film Analysis</h1>
              <p className="text-[#999] text-sm leading-relaxed">
                Paste a YouTube URL, tag your players, and let AI break down every play with coaching-grade feedback.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">YouTube Film URL</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Position Group</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm focus:border-[#CDFD51] focus:outline-none transition-colors"
                >
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamNameState(e.target.value)}
                  placeholder="Enter your team name e.g. Lincoln Tigers"
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Player Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter player name"
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Player Age / Grade Level</label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 12 years old / 7th grade"
                  className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                />
              </div>

              {/* Change #2: QB Game Stats Form */}
              {position === 'QB' && (
                <div style={{
                  background: '#1a1a1a', border: '1px solid #333',
                  borderRadius: '12px', padding: '20px', marginTop: '16px'
                }}>
                  <h4 style={{ color: '#39FF14', marginBottom: '16px' }}>QB Game Stats</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    {['passingYards', 'rushingYards', 'completions', 'attempts', 'touchdowns', 'interceptions'].map(stat => (
                      <div key={stat}>
                        <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                          {stat.replace(/([A-Z])/g, ' $1').toUpperCase()}
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={(qbStats as any)[stat]}
                          onChange={(e) => setQbStats({ ...qbStats, [stat]: e.target.value })}
                          style={{
                            width: '100%', background: '#111', border: '1px solid #333',
                            borderRadius: '8px', padding: '10px', color: '#fff', fontSize: '16px'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  {parseInt(qbStats.attempts) > 0 && (
                    <div style={{ marginTop: '12px', color: '#39FF14', fontSize: '14px' }}>
                      Completion Rate: {((parseInt(qbStats.completions) / parseInt(qbStats.attempts)) * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Player Identification */}
            <div className="border-t border-[#333] pt-6">
              <h3 className="text-white font-semibold text-sm mb-4">Player Identification</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#999] text-xs mb-1">Jersey Number</label>
                    <input
                      type="text"
                      value={jerseyNumber}
                      onChange={(e) => setJerseyNumber(e.target.value)}
                      placeholder="#"
                      className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#999] text-xs mb-1">Start Time (MM:SS)</label>
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="00:00"
                      className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#999] text-xs mb-1">Visual Descriptors</label>
                  <input
                    type="text"
                    value={descriptors}
                    onChange={(e) => setDescriptors(e.target.value)}
                    placeholder="e.g. pink wristband, yellow cleats, #32"
                    className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#999] text-xs mb-1">Player Name / Label</label>
                  <input
                    type="text"
                    value={tagLabel}
                    onChange={(e) => setTagLabel(e.target.value)}
                    placeholder="Label for this tag"
                    className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={addTag}
                  className="w-full py-2.5 border border-[#CDFD51] text-[#CDFD51] rounded-lg text-sm font-semibold hover:bg-[#CDFD51]/10 transition-colors"
                >
                  Add Player Tag
                </button>
              </div>

              {/* Tags Display */}
              {playerTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {playerTags.map(tag => (
                    <div key={tag.id} className="inline-flex items-center gap-2 bg-[#CDFD51]/10 border border-[#CDFD51]/30 rounded-full px-3 py-1.5">
                      <span className="text-[#CDFD51] text-xs font-medium">#{tag.jersey} {tag.label}</span>
                      <button onClick={() => removeTag(tag.id)} className="text-[#CDFD51]/60 hover:text-[#CDFD51]">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Analyze Button */}
            <button
              onClick={analyzeFilm}
              disabled={loading || !youtubeUrl}
              className="w-full py-4 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Analyzing Film...
                </span>
              ) : 'Analyze Film'}
            </button>
            <p className="text-[#666] text-xs text-center">
              {user ? 'Results are saved to your database' : 'Sign in to save results to your profile'}
            </p>
          </div>

          {/* Right Column - Results Panel */}
          <div className="lg:col-span-3">
            {!results && !loading && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-16 flex flex-col items-center justify-center min-h-[500px]">
                <svg className="w-20 h-20 text-[#444] mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-[#666] text-sm text-center max-w-xs">
                  Paste a YouTube URL and click Analyze Film to get started
                </p>
              </div>
            )}

            {loading && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-16 flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-16 h-16 border-4 border-[#333] border-t-[#CDFD51] rounded-full animate-spin mb-6" />
                <p className="text-white font-medium mb-2">Analyzing Film...</p>
                <p className="text-[#666] text-sm">Coach Prime is reviewing every play</p>
              </div>
            )}

            {results && !results.error && (
              <div className="space-y-6">
                {/* Player Header */}
                <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{playerName || 'Player'}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-[#CDFD51]/20 text-[#CDFD51] rounded-full text-xs font-bold">{position}</span>
                        <span className="text-[#999] text-sm">{teamName}</span>
                        <span className="text-[#666] text-sm">{age}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black ${
                        results.overallGrade === 'ELITE' ? 'bg-[#CDFD51]/20 text-[#CDFD51]' :
                        results.overallGrade === 'DEVELOPING' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {results.letterGrade || 'B'}
                      </div>
                      <div className="mt-1">
                        <GradeBadge grade={results.overallGrade || 'DEVELOPING'} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {getPositionStats().map(s => (
                    <div key={s.key} className="bg-[#2a2a2a] rounded-xl border border-[#333] p-4">
                      <div className="text-[#999] text-xs mb-1">{s.label}</div>
                      <input
                        type="number"
                        value={stats[s.key] || 0}
                        onChange={(e) => setStats({ ...stats, [s.key]: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent text-white text-2xl font-bold focus:outline-none"
                      />
                    </div>
                  ))}
                  {completionPct !== null && (
                    <div className="bg-[#2a2a2a] rounded-xl border border-[#CDFD51]/30 p-4">
                      <div className="text-[#CDFD51] text-xs mb-1">Completion %</div>
                      <div className="text-[#CDFD51] text-2xl font-bold">{completionPct}%</div>
                    </div>
                  )}
                </div>

                {/* AI Feedback Tabs */}
                <div className="bg-[#2a2a2a] rounded-2xl border border-[#333]">
                  <div className="flex border-b border-[#333]">
                    {['overview', 'play-by-play', 'growth'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                          activeTab === tab
                            ? 'text-[#CDFD51] border-b-2 border-[#CDFD51]'
                            : 'text-[#999] hover:text-white'
                        }`}
                      >
                        {tab === 'overview' ? 'Overview' : tab === 'play-by-play' ? 'Play-by-Play' : 'Areas for Growth'}
                      </button>
                    ))}
                  </div>

                  <div className="p-6">
                    {activeTab === 'overview' && (
                      <div className="space-y-4">
                        <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{results.overview}</p>
                        {results.categories && (
                          <div className="space-y-3 mt-6">
                            {results.categories.map((cat: any, i: number) => (
                              <div key={i} className="bg-[#1a1a1a] rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-white font-medium text-sm">{cat.name}</span>
                                  <GradeBadge grade={cat.grade} />
                                </div>
                                <p className="text-[#999] text-xs leading-relaxed">{cat.feedback}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'play-by-play' && results.plays && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[#666] text-xs uppercase tracking-wider">
                              <th className="text-left py-2 pr-4">Play</th>
                              <th className="text-left py-2 pr-4">Time</th>
                              <th className="text-left py-2 pr-4">Action</th>
                              <th className="text-left py-2 pr-4">Grade</th>
                              <th className="text-left py-2">Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.plays.map((play: any, i: number) => (
                              <tr key={i} className="border-t border-[#333]">
                                <td className="py-3 pr-4 text-white font-medium">{play.play}</td>
                                <td className="py-3 pr-4 text-[#999]">{play.time}</td>
                                <td className="py-3 pr-4 text-[#ccc] max-w-[200px]">{play.action}</td>
                                <td className="py-3 pr-4"><GradeBadge grade={play.grade} /></td>
                                <td className="py-3 text-[#999] text-xs max-w-[200px]">{play.notes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {activeTab === 'growth' && results.areasForGrowth && (
                      <div className="space-y-4">
                        {results.areasForGrowth.map((area: any, i: number) => (
                          <div key={i} className="bg-[#1a1a1a] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-white font-medium text-sm">{area.area}</span>
                              <GradeBadge grade={area.currentLevel} />
                            </div>
                            <p className="text-[#999] text-xs leading-relaxed">{area.recommendation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={saveToProfile}
                    disabled={saved}
                    className={`flex-1 min-w-[140px] py-3 rounded-lg font-semibold text-sm transition-all ${
                      saved
                        ? 'bg-[#CDFD51]/20 text-[#CDFD51] border border-[#CDFD51]/30'
                        : 'bg-[#CDFD51] text-[#1a1a1a] hover:bg-[#b8e845]'
                    }`}
                  >
                    {saved ? 'Saved to Profile' : 'Save to Player Profile'}
                  </button>
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-6 py-3 border border-[#CDFD51] text-[#CDFD51] rounded-lg font-semibold text-sm hover:bg-[#CDFD51]/10 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share Report
                  </button>
                  <button
                    onClick={() => {
                      const text = JSON.stringify(results, null, 2);
                      const blob = new Blob([text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${playerName || 'player'}-film-report.txt`;
                      a.click();
                    }}
                    className="px-6 py-3 border border-[#555] text-white rounded-lg font-semibold text-sm hover:border-[#CDFD51] hover:text-[#CDFD51] transition-colors"
                  >
                    Export Report
                  </button>
                </div>
              </div>
            )}

            {results?.error && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-red-500/30 p-8 text-center">
                <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-400 font-medium mb-2">Analysis Failed</p>
                <p className="text-[#999] text-sm">{results.error}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareReportModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        reportType="film_analysis"
        reportData={getShareData()}
      />
    </div>
  );
};

export default FilmAnalysis;
