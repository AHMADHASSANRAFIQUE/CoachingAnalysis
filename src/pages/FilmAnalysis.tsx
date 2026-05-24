import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { saveGameSession, getPlayerProfiles, generateId, getTeamName, getLocalGameHistory, saveLocalGameHistory, getLocalBenchmarks, saveLocalBenchmarks, GameHistoryEntry, getMonthlyAnalysisCount } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import ShareReportModal from '@/components/ShareReportModal';
import PricingAdModal from '@/components/PricingAdModal';

interface PlayerTag {
  id: string;
  jersey: string;
  startTime: string;
  descriptors: string;
  label: string;
  actionDescription?: string;
}

const POSITIONS = ['QB', 'WR', 'RB', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'];

const LOADING_STEPS = [
  { label: 'Initializing secure connection...' },
  { label: 'Fetching game film visual track...' },
  { label: 'Syncing video frames with Gemini secure vault...' },
  { label: 'Coach Legend is evaluating offensive/defensive lineups...' },
  { label: 'Cross-referencing jersey colors and team roster...' },
  { label: 'Compiling final scouting report and player grades...' }
];

const COACH_TIPS = [
  { title: "RPO Mechanics", text: "In a standard RPO (Run-Pass Option), the quarterback decides whether to hand off or pass by reading the reaction of a single 'conflict' defender (usually the linebacker)." },
  { title: "Defeating Cover 3", text: "Cover 3 places three deep defenders. The best way to beat this is targeting the deep seams or using 'four verticals' to stretch the single-high safety." },
  { title: "Route Running Excellence", text: "A great receiver runs routes at the exact same speed as a vertical release. Break off your route at the last second to catch the defensive back off-balance." },
  { title: "Pre-Snap QB Check", text: "Always identify the Mike (middle) linebacker before the snap. This sets the pass protection and identifies the strong side of the defense." },
  { title: "Coach Legend's Rule #1", text: "\"You don't play to contain; you play to dominate. Execution beats strategy every single day of the week.\" — Nick Saban" },
  { title: "Mental Toughness", text: "\"Today I will do what others won't, so tomorrow I can accomplish what others can't.\" — Jerry Rice" }
];

const TRIVIA_QUESTIONS = [
  {
    q: "What is the primary responsibility of a 'Will' (Weak-side) Linebacker in a 4-3 defense?",
    options: ["A-Gap run containment", "Man-to-man on the slot WR", "Pursuing the ball carrier in space (C/D Gaps) and coverage"],
    answer: 2,
    explanation: "Correct! The Weak-side Linebacker (Will) must play fast in space, pursuing outside runs and dropping into space for pass coverage."
  },
  {
    q: "If a defense plays '2-High' safeties and drop both into deep halves, what coverage is this?",
    options: ["Cover 1", "Cover 2", "Cover 3"],
    answer: 1,
    explanation: "Correct! Cover 2 features two deep safeties covering deep halves, and five underneath defenders covering zones."
  },
  {
    q: "What route concept features a deep post combined with an underneath dig route to stretch safeties?",
    options: ["Mills Concept", "Smash Concept", "Flood Concept"],
    answer: 0,
    explanation: "Correct! The Mills concept uses a post and a dig to force the safety to choose between covering the dig or the deep post."
  }
];

const getGradeColor = (grade: string, letter?: string) => {
  const normalizedGrade = grade?.toUpperCase() || '';
  const normalizedLetter = letter?.toUpperCase() || '';
  
  if (normalizedGrade === 'ELITE' || normalizedLetter.startsWith('A')) {
    return 'bg-[#CDFD51]/20 text-[#CDFD51] border-[#CDFD51]/30';
  }
  if (normalizedGrade === 'DEVELOPING' || normalizedLetter.startsWith('B')) {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  }
  if (normalizedGrade === 'NEEDS CONSISTENCY' || ['C', 'D', 'F'].includes(normalizedLetter[0])) {
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
};

const GradeBadge: React.FC<{ grade: string, letter?: string }> = ({ grade, letter }) => {
  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getGradeColor(grade, letter)}`}>
      {grade}
    </span>
  );
};

const FilmAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [activeTipIdx, setActiveTipIdx] = useState(0);
  const [triviaIdx, setTriviaIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [position, setPosition] = useState('QB');
  const [teamName, setTeamNameState] = useState(getTeamName() || '');
  const [playerName, setPlayerName] = useState('');
  const [age, setAge] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [startTime, setStartTime] = useState('');
  const [descriptors, setDescriptors] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [highlightTagging, setHighlightTagging] = useState(false);
  const [jerseyColor, setJerseyColor] = useState('');
  const [roster, setRoster] = useState('');
  const [playerTimestamps, setPlayerTimestamps] = useState('');
  const [tagLabel, setTagLabel] = useState('');
  const [playerTags, setPlayerTags] = useState<PlayerTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPricingAd, setShowPricingAd] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);

  const handleGoToTagging = () => {
    const elem = document.getElementById('player-tagging-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightTagging(true);
      setTimeout(() => setHighlightTagging(false), 3000);
    }
  };

  // Check monthly limit and Restore Session on mount
  React.useEffect(() => {
    const checkLimit = async () => {
      const count = await getMonthlyAnalysisCount();
      setAnalysisCount(count);
      if (count >= 1) setShowPricingAd(true);
    };
    checkLimit();

    // Restore from sessionStorage
    const savedSession = sessionStorage.getItem('last_analysis');
    if (savedSession) {
      const data = JSON.parse(savedSession);
      setYoutubeUrl(data.youtubeUrl || '');
      setPlayerName(data.playerName || '');
      setTeamNameState(data.teamName || '');
      setJerseyColor(data.jerseyColor || '');
      setRoster(data.roster || '');
      setPlayerTimestamps(data.playerTimestamps || '');
      setResults(data.results || null);
      if (data.results?.suggestedStats) setStats(data.results.suggestedStats);
    }
  }, []);

  // Stepper and Tip rotation timers
  React.useEffect(() => {
    let stepTimer: any;
    let tipTimer: any;

    if (loading) {
      // 1. Advance steps on a timed interval
      stepTimer = setInterval(() => {
        setActiveStep(prev => (prev < 5 ? prev + 1 : prev));
      }, 7000);

      // 2. Rotate coaching tips every 8 seconds
      tipTimer = setInterval(() => {
        setActiveTipIdx(prev => (prev + 1) % COACH_TIPS.length);
      }, 8000);
    } else {
      setActiveStep(0);
    }

    return () => {
      clearInterval(stepTimer);
      clearInterval(tipTimer);
    };
  }, [loading]);

  // Save results to sessionStorage whenever they change
  React.useEffect(() => {
    if (results || youtubeUrl || playerName) {
      sessionStorage.setItem('last_analysis', JSON.stringify({
        youtubeUrl,
        playerName,
        teamName,
        jerseyColor,
        roster,
        playerTimestamps,
        results
      }));
    }
  }, [results, youtubeUrl, playerName, teamName, jerseyColor, roster, playerTimestamps]);

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
    const base = `You are Coach Legend, an elite SEC head football coach with 25+ years of experience.
You speak directly, use motivational language, and provide ADVANCED position-specific feedback.
Player: ${playerInfo.name}, #${playerInfo.jersey}, Team: ${playerInfo.teamName} (${playerInfo.jerseyColor || 'N/A'})
Age/Level: ${playerInfo.ageLevel}
Team Roster (Mandatory): ${playerInfo.roster || 'Not provided'}
Highlight Timestamps in Film: ${playerInfo.timestamps || 'Throughout film'}
Description for film identification: ${playerInfo.description}
CRITICAL INSTRUCTION FOR PLAYER DISAMBIGUATION: When multiple players appear at the same position (e.g., multiple QBs sharing snaps), you MUST evaluate ONLY the specific player active at the provided Highlight Timestamps (${playerInfo.timestamps || 'Throughout film'}). Do NOT credit, attribute, or grade plays from other players at this position.
IMPORTANT: Compare ONLY to age-appropriate (${playerInfo.ageLevel}) benchmarks. NOT NFL.
NEVER mention teams like Duncanville or Desoto unless they are explicitly named as the Opponent above.
ONLY analyze the provided team and players. Do not hallucinate external context.`;

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
      actionDescription: actionDescription,
    }]);
    setJerseyNumber('');
    setStartTime('');
    setDescriptors('');
    setTagLabel('');
    setActionDescription('');
  };

  const removeTag = (id: string) => {
    setPlayerTags(playerTags.filter(t => t.id !== id));
  };

  const analyzeFilm = async () => {
    if (!youtubeUrl) return;

    if (!roster.trim()) {
      alert("Please provide the Team Roster (Names and Jersey Numbers). This is mandatory for AI to accurately identify your player.");
      return;
    }

    const effectiveTimestamps = playerTimestamps.trim() || playerTags.map(t => t.startTime).join(', ') || startTime;
    if (!effectiveTimestamps.trim()) {
      alert("Please provide Highlight Timestamps for your player (e.g., 01:24, 03:45). This is critical so AI doesn't evaluate another player at the same position.");
      return;
    }

    // Check limit before starting
    const currentCount = await getMonthlyAnalysisCount();
    if (currentCount >= 1) {
      setShowPricingAd(true);
      return;
    }

    setLoading(true);
    setResults(null);
    setSaved(false);
    setActiveStep(0);
    setSelectedOption(null);
    setQuizChecked(false);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('analyze-film', {
        body: {
          youtubeUrl,
          position,
          teamName,
          playerName,
          age,
          jerseyNumber: playerTags[0]?.jersey || jerseyNumber,
          startTime: effectiveTimestamps,
          descriptors: playerTags.map(t => `${t.descriptors}${t.actionDescription ? ` (Action/What Happened: ${t.actionDescription})` : ''}`).join(', ') || descriptors,
          analysisType: 'player',
          jerseyColor,
          roster,
          customPrompt: buildGeminiPrompt({
            name: playerName,
            jersey: playerTags[0]?.jersey || jerseyNumber,
            teamName,
            jerseyColor,
            roster,
            timestamps: effectiveTimestamps,
            ageLevel: age,
            position,
            description: playerTags.map(t => `${t.descriptors}${t.actionDescription ? ` (Action/What Happened: ${t.actionDescription})` : ''}`).join(', ') || descriptors
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
      feedback: {
        ...results,
        meta: {
          roster,
          jerseyColor,
          playerTimestamps,
        }
      },
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamNameState(e.target.value)}
                    placeholder="e.g. Lincoln Tigers"
                    className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Jersey Color</label>
                  <input
                    type="text"
                    value={jerseyColor}
                    onChange={(e) => setJerseyColor(e.target.value)}
                    placeholder="e.g. Red/White"
                    className="w-full bg-[#2a2a2a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2 flex items-center gap-1">
                  Team Roster <span className="text-red-400 font-bold">*Mandatory</span>
                </label>
                <textarea
                  value={roster}
                  onChange={(e) => setRoster(e.target.value)}
                  placeholder="Paste player names and numbers (e.g. #12 John Doe)..."
                  rows={3}
                  className="w-full bg-[#2a2a2a] border border-red-500/30 rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors resize-none"
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

              <div>
                <label className="block text-white text-sm font-medium mb-2 flex items-center gap-1">
                  Player Highlight Timestamps <span className="text-red-400 font-bold">*Mandatory</span>
                </label>
                <input
                  type="text"
                  value={playerTimestamps}
                  onChange={(e) => setPlayerTimestamps(e.target.value)}
                  placeholder="e.g., 01:24, 03:45, 08:12 (Critical for correct player ID)"
                  className="w-full bg-[#2a2a2a] border border-red-500/30 rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
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
            <div 
              id="player-tagging-section" 
              className={`border border-[#333] rounded-xl p-5 space-y-4 transition-all duration-500 ${
                highlightTagging 
                  ? 'ring-2 ring-[#CDFD51] shadow-[0_0_20px_rgba(205,253,81,0.6)] bg-[#CDFD51]/5 border-transparent' 
                  : 'bg-[#2a2a2a]/20'
              }`}
            >
              <h3 className="text-white font-bold text-sm">Player Identification & Tagging</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#999] text-xs mb-1">Jersey Number</label>
                    <input
                      type="text"
                      value={jerseyNumber}
                      onChange={(e) => setJerseyNumber(e.target.value)}
                      placeholder="#"
                      className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#999] text-xs mb-1">Start Time (MM:SS)</label>
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="00:00"
                      className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
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
                    className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#999] text-xs mb-1 flex items-center gap-1.5">
                    Play Action / What Happened <span className="text-[#CDFD51] text-[10px] font-bold uppercase tracking-wider bg-[#CDFD51]/10 px-1.5 py-0.5 rounded">Highly Recommended</span>
                  </label>
                  <input
                    type="text"
                    value={actionDescription}
                    onChange={(e) => setActionDescription(e.target.value)}
                    placeholder="e.g. completed 15yd TD pass, made tackle for loss"
                    className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[#999] text-xs mb-1">Player Name / Label</label>
                  <input
                    type="text"
                    value={tagLabel}
                    onChange={(e) => setTagLabel(e.target.value)}
                    placeholder="Label for this tag"
                    className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2.5 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none transition-colors"
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
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#333]">
                  {playerTags.map(tag => (
                    <div key={tag.id} className="inline-flex items-center gap-2 bg-[#CDFD51]/10 border border-[#CDFD51]/30 rounded-full px-3 py-1.5 max-w-full">
                      <span className="text-[#CDFD51] text-xs font-medium truncate">
                        #{tag.jersey} {tag.label} {tag.actionDescription && `(${tag.actionDescription})`}
                      </span>
                      <button onClick={() => removeTag(tag.id)} className="text-[#CDFD51]/60 hover:text-[#CDFD51] flex-shrink-0">
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
              <div className="bg-[#1a1a1a] rounded-2xl border border-[#333] p-8 md:p-12 space-y-8 min-h-[500px]">
                {/* Header */}
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-[#333] border-t-[#CDFD51] rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-2xl font-black text-white uppercase tracking-wider">Scouting Film In Progress</h3>
                  <p className="text-[#999] text-sm">Coach Legend is reviewing every play in high-definition</p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#2a2a2a] h-2 rounded-full overflow-hidden border border-[#333]">
                  <div 
                    className="bg-[#CDFD51] h-full shadow-[0_0_12px_#CDFD51] transition-all duration-1000 ease-out"
                    style={{ width: `${((activeStep + 1) / 6) * 100}%` }}
                  />
                </div>

                {/* Stepper Grid & Trivia/Chalkboard side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Stepper Timeline */}
                  <div className="space-y-4 bg-[#222] rounded-xl p-6 border border-[#333]">
                    <h4 className="text-[#CDFD51] text-xs font-black uppercase tracking-widest mb-4">Processing Pipeline</h4>
                    <div className="space-y-4">
                      {LOADING_STEPS.map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 transition-all duration-300">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx < activeStep 
                              ? 'bg-[#CDFD51] text-[#1a1a1a]' 
                              : idx === activeStep 
                                ? 'border border-[#CDFD51] text-[#CDFD51] animate-pulse'
                                : 'border border-[#444] text-[#666]'
                          }`}>
                            {idx < activeStep ? '✓' : idx + 1}
                          </div>
                          <span className={`text-xs font-medium ${
                            idx === activeStep 
                              ? 'text-white font-semibold' 
                              : idx < activeStep 
                                ? 'text-[#999]' 
                                : 'text-[#555]'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Engagement Panels */}
                  <div className="space-y-6">
                    {/* Coach's Chalkboard Tip Card */}
                    <div className="bg-[#222] rounded-xl p-6 border border-[#333] relative overflow-hidden transition-all duration-500 hover:border-[#CDFD51]/50">
                      <div className="absolute top-0 right-0 px-3 py-1 bg-[#CDFD51] text-[#1a1a1a] text-[10px] font-black uppercase tracking-wider rounded-bl-lg">
                        Coach's Chalkboard
                      </div>
                      <h4 className="text-[#CDFD51] text-sm font-black uppercase tracking-wider mb-2">
                        {COACH_TIPS[activeTipIdx].title}
                      </h4>
                      <p className="text-[#ccc] text-xs leading-relaxed italic">
                        "{COACH_TIPS[activeTipIdx].text}"
                      </p>
                    </div>

                    {/* Football IQ Quiz Card */}
                    <div className="bg-[#222] rounded-xl p-6 border border-[#333] space-y-4">
                      <div className="flex items-center justify-between border-b border-[#333] pb-2">
                        <h4 className="text-white text-xs font-black uppercase tracking-widest">Football IQ Trivia</h4>
                        <span className="text-[#666] text-[10px]">Quiz {triviaIdx + 1} of {TRIVIA_QUESTIONS.length}</span>
                      </div>
                      
                      <p className="text-white text-xs font-medium leading-relaxed">
                        {TRIVIA_QUESTIONS[triviaIdx].q}
                      </p>

                      <div className="space-y-2">
                        {TRIVIA_QUESTIONS[triviaIdx].options.map((option, optIdx) => (
                          <button
                            key={optIdx}
                            disabled={quizChecked}
                            onClick={() => setSelectedOption(optIdx)}
                            className={`w-full text-left p-3 rounded-lg text-xs font-medium border transition-all ${
                              selectedOption === optIdx
                                ? quizChecked
                                  ? optIdx === TRIVIA_QUESTIONS[triviaIdx].answer
                                    ? 'bg-[#CDFD51]/20 border-[#CDFD51] text-[#CDFD51]'
                                    : 'bg-red-500/20 border-red-500 text-red-400'
                                  : 'bg-[#CDFD51]/10 border-[#CDFD51] text-white'
                                : 'bg-[#1a1a1a] border-[#333] text-[#999] hover:border-[#444] hover:text-white'
                            }`}
                          >
                            {optIdx === 0 ? 'A) ' : optIdx === 1 ? 'B) ' : 'C) '} {option}
                          </button>
                        ))}
                      </div>

                      {selectedOption !== null && !quizChecked && (
                        <button
                          onClick={() => setQuizChecked(true)}
                          className="w-full py-2 bg-[#CDFD51] text-[#1a1a1a] text-xs font-bold rounded-lg hover:bg-[#b8e845] transition-colors"
                        >
                          Submit Answer
                        </button>
                      )}

                      {quizChecked && (
                        <div className="space-y-3 pt-2">
                          <div className={`p-3 rounded-lg text-xs font-medium ${
                            selectedOption === TRIVIA_QUESTIONS[triviaIdx].answer
                              ? 'bg-[#CDFD51]/10 text-[#CDFD51] border border-[#CDFD51]/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {TRIVIA_QUESTIONS[triviaIdx].explanation}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedOption(null);
                              setQuizChecked(false);
                              setTriviaIdx(prev => (prev + 1) % TRIVIA_QUESTIONS.length);
                            }}
                            className="w-full py-2 border border-[#CDFD51] text-[#CDFD51] text-xs font-bold rounded-lg hover:bg-[#CDFD51]/10 transition-colors"
                          >
                            Next Question
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {results && !results.error && (
              <div className="space-y-6">
                {/* Visual Status Indicator Badge */}
                <div className="flex items-center justify-between p-3.5 bg-[#2a2a2a] rounded-xl border border-[#333] flex-wrap gap-2.5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        results.synthesisMode ? 'bg-amber-400' : 'bg-[#CDFD51]'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        results.synthesisMode ? 'bg-amber-400' : 'bg-[#CDFD51]'
                      }`}></span>
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {results.synthesisMode 
                        ? 'Scouting Synthesis Mode' 
                        : 'Visual Tracking Mode: Online'
                      }
                    </span>
                  </div>
                  {results.synthesisMode && (
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-wider">
                      Visual Offline, Grounded in Roster & Descriptors
                    </span>
                  )}
                </div>

                <>
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
                          <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black ${getGradeColor(results.overallGrade, results.letterGrade)}`}>
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
                  </>
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

      {/* Pricing Ad Modal */}
      <PricingAdModal
        isOpen={showPricingAd}
        onClose={() => setShowPricingAd(false)}
      />

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
