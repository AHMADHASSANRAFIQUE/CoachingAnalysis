import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { saveCoachReport, getCoachReports, generateId, getTeamName, type CoachGameReport } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import ShareReportModal from '@/components/ShareReportModal';

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

const GradeBadge: React.FC<{ grade: string; letter?: string }> = ({ grade, letter }) => (
  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getGradeColor(grade, letter)}`}>
    {grade}
  </span>
);

// Player tag attached to a specific timestamp in the position spotlight
interface PlayPlayerTag {
  positionIndex: number;
  playIndex: number;
  playerName: string;
}

const Coaches: React.FC = () => {
  const { user } = useAuth();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [jerseyColor, setJerseyColor] = useState('');
  const [teamName, setTeamName] = useState(getTeamName() || '');
  const [opponent, setOpponent] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [gameType, setGameType] = useState('Regular Season');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [coachNotes, setCoachNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [pastReports, setPastReports] = useState<CoachGameReport[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  // Player tags for position spotlight — keyed by "posIdx-playIdx"
  const [playerTags, setPlayerTags] = useState<Record<string, string>>({});
  const [highlightNotes, setHighlightNotes] = useState(false);

  const handleGoToNotes = () => {
    const elem = document.getElementById('coach-notes-section');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightNotes(true);
      setTimeout(() => setHighlightNotes(false), 3000);
    }
  };

  useEffect(() => {
    const loadReports = async () => {
      const reports = await getCoachReports();
      setPastReports(reports);
    };
    loadReports();

    const savedSession = sessionStorage.getItem('last_coach_analysis');
    if (savedSession) {
      const data = JSON.parse(savedSession);
      setYoutubeUrl(data.youtubeUrl || '');
      setTeamName(data.teamName || '');
      setJerseyColor(data.jerseyColor || '');
      setOpponent(data.opponent || '');
      setReport(data.report || null);
      setPlayerTags(data.playerTags || {});
    }
  }, []);

  useEffect(() => {
    if (report || youtubeUrl || teamName) {
      sessionStorage.setItem('last_coach_analysis', JSON.stringify({
        youtubeUrl, teamName, jerseyColor, opponent, report, playerTags,
      }));
    }
  }, [report, youtubeUrl, teamName, jerseyColor, opponent, playerTags]);

  const analyzeGame = async () => {
    if (!youtubeUrl) return;
    setLoading(true);
    setReport(null);
    setSaved(false);
    setPlayerTags({});

    try {
      const { data, error } = await supabase.functions.invoke('analyze-film', {
        body: {
          youtubeUrl,
          teamName,
          opponent,
          gameDate,
          gameType,
          analysisType: 'coach-game',
          jerseyColor,
          coachNotes,
        },
      });

      if (error) throw error;
      if (data?.data) {
        let finalReport = data.data;
        if (typeof finalReport.assessment === 'string' && finalReport.assessment.trim().startsWith('{')) {
          try {
            finalReport = JSON.parse(finalReport.assessment.trim());
          } catch (e) {
            console.error('Frontend JSON fallback parsing failed:', e);
          }
        }
        setReport(finalReport);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setReport({ error: err.message || 'Analysis failed' });
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerTag = (posIdx: number, playIdx: number, value: string) => {
    const key = `${posIdx}-${playIdx}`;
    setPlayerTags(prev => ({ ...prev, [key]: value }));
    setSaved(false); // mark unsaved when tags change
  };

  // Merge current playerTags into the report's positionSpotlight before saving
  const buildReportWithTags = () => {
    if (!report?.positionSpotlight) return report;
    const updated = {
      ...report,
      positionSpotlight: report.positionSpotlight.map((pos: any, posIdx: number) => ({
        ...pos,
        keyPlays: (pos.keyPlays || []).map((play: any, playIdx: number) => ({
          ...play,
          playerTag: playerTags[`${posIdx}-${playIdx}`] ?? play.playerTag ?? '',
        })),
      })),
    };
    return updated;
  };

  const handleSaveReport = async () => {
    const reportWithTags = buildReportWithTags();
    const r: CoachGameReport = {
      id: generateId(),
      date: gameDate || new Date().toISOString().split('T')[0],
      teamName,
      opponent,
      gameType,
      youtubeUrl,
      report: reportWithTags,
      coachNotes,
      createdAt: new Date().toISOString(),
    };
    await saveCoachReport(r);
    setSaved(true);
    const updated = await getCoachReports();
    setPastReports(updated);
  };

  const exportReport = () => {
    const text = `LEGEND Game Report\n${'='.repeat(50)}\n\n${teamName} vs ${opponent}\nDate: ${gameDate}\nType: ${gameType}\n\nOverall Grade: ${report?.overallGrade || 'N/A'} (${report?.gradeLabel || 'N/A'})\n\nAssessment:\n${report?.assessment || 'N/A'}\n\nCoach Notes:\n${coachNotes}\n\n${JSON.stringify(buildReportWithTags(), null, 2)}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-report-${teamName}-vs-${opponent}.txt`;
    a.click();
  };

  const getShareData = () => ({
    teamName, opponent, date: gameDate, gameType, youtubeUrl,
    report: buildReportWithTags(), coachNotes,
  });


  return (
    <div className="font-lexend min-h-screen pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Coach Dashboard</h1>
              <p className="text-[#999] text-sm mt-1">Film review intelligence for Friday night and Monday morning.</p>
            </div>
            {user && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#CDFD51]/10 rounded-full border border-[#CDFD51]/20">
                <div className="w-2 h-2 rounded-full bg-[#CDFD51]" />
                <span className="text-[#CDFD51] text-xs font-semibold">Logged in as {user.email.split('@')[0]}</span>
              </div>
            )}
          </div>
        </div>

        {/* Game Analysis Input */}
        <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Game Analysis Input</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-[#999] text-xs mb-1">Game YouTube URL</label>
              <input
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#999] text-xs mb-1">Team Name</label>
              <input
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="Your team name"
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#999] text-xs mb-1">Jersey Color</label>
              <input
                value={jerseyColor}
                onChange={e => setJerseyColor(e.target.value)}
                placeholder="e.g. Blue/White"
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#999] text-xs mb-1">Opponent Name</label>
              <input
                value={opponent}
                onChange={e => setOpponent(e.target.value)}
                placeholder="Opponent team"
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#999] text-xs mb-1">Game Date</label>
              <input
                type="date"
                value={gameDate}
                onChange={e => setGameDate(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm focus:border-[#CDFD51] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#999] text-xs mb-1">Game Type</label>
              <select
                value={gameType}
                onChange={e => setGameType(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm focus:border-[#CDFD51] focus:outline-none"
              >
                <option>Regular Season</option>
                <option>Playoffs</option>
                <option>Scrimmage</option>
                <option>Practice</option>
              </select>
            </div>
          </div>
          <button
            onClick={analyzeGame}
            disabled={loading || !youtubeUrl}
            className="w-full mt-6 py-4 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing Full Game...
              </span>
            ) : 'Analyze Full Game'}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-16 flex flex-col items-center justify-center mb-8">
            <div className="w-16 h-16 border-4 border-[#333] border-t-[#CDFD51] rounded-full animate-spin mb-6" />
            <p className="text-white font-medium mb-2">Analyzing Full Game...</p>
            <p className="text-[#666] text-sm">Coach Legend is breaking down every phase of the game</p>
          </div>
        )}

        {/* Report Display */}
        {report && !report.error && (
          <div className="space-y-6 animate-fade-in">
            {/* Visual Status Indicator Badge */}
            <div className="flex items-center justify-between p-3.5 bg-[#2a2a2a] rounded-xl border border-[#333] flex-wrap gap-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    report.synthesisMode ? 'bg-amber-400' : 'bg-[#CDFD51]'
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    report.synthesisMode ? 'bg-amber-400' : 'bg-[#CDFD51]'
                  }`}></span>
                </span>
                <span className="text-xs font-semibold text-white">
                  {report.synthesisMode 
                    ? 'Scouting Synthesis Mode' 
                    : 'Visual Tracking Mode: Online'
                  }
                </span>
              </div>
              {report.synthesisMode && (
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase tracking-wider">
                  Visual Offline, Grounded in Roster & Descriptors
                </span>
              )}
            </div>

            <>
                {/* Challenges */}
                <div className="bg-[#2a2a2a] rounded-2xl border border-red-500/20 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h2 className="text-xl font-bold text-white">3 BIGGEST CHALLENGES THIS GAME</h2>
                  </div>
                  <div className="space-y-4">
                    {(report.challenges || []).map((c: any, i: number) => (
                      <div key={i} className="bg-[#1a1a1a] rounded-xl p-5 border-l-4 border-red-500/50">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-white font-semibold">{c.title}</h3>
                          <GradeBadge grade={c.grade || 'NEEDS CONSISTENCY'} />
                        </div>
                        <p className="text-[#ccc] text-sm mb-2">{c.description}</p>
                        <p className="text-[#666] text-xs mb-2">{c.timestamps}</p>
                        <div className="bg-red-500/5 rounded-lg p-3 mt-2">
                          <p className="text-red-300 text-xs"><span className="font-semibold">Recommendation:</span> {c.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Wins */}
                <div className="bg-[#2a2a2a] rounded-2xl border border-[#CDFD51]/20 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-[#CDFD51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <h2 className="text-xl font-bold text-white">3 THINGS THAT WENT BEST</h2>
                  </div>
                  <div className="space-y-4">
                    {(report.wins || []).map((w: any, i: number) => (
                      <div key={i} className="bg-[#1a1a1a] rounded-xl p-5 border-l-4 border-[#CDFD51]/50">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-white font-semibold">{w.title}</h3>
                          <GradeBadge grade={w.grade || 'ELITE'} />
                        </div>
                        <p className="text-[#ccc] text-sm mb-2">{w.description}</p>
                        <p className="text-[#666] text-xs mb-2">{w.timestamps}</p>
                        <div className="bg-[#CDFD51]/5 rounded-lg p-3 mt-2">
                          <p className="text-[#CDFD51]/80 text-xs"><span className="font-semibold">Build On:</span> {w.buildOn}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overall Assessment */}
                <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                  <h2 className="text-xl font-bold text-white mb-4">OVERALL GAME ASSESSMENT</h2>
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black ${getGradeColor(report.overallGrade, report.letterGrade)}`}>
                      {report.letterGrade || 'B'}
                    </div>
                    <div>
                      <GradeBadge grade={report.gradeLabel || 'DEVELOPING'} />
                      <p className="text-[#999] text-xs mt-1">{teamName} vs {opponent}</p>
                    </div>
                  </div>
                  <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap mb-4">{report.assessment}</p>
                  {report.matchupNotes && (
                    <div className="bg-[#1a1a1a] rounded-lg p-4 mt-4">
                      <h4 className="text-white font-medium text-sm mb-2">Key Matchup Notes</h4>
                      <p className="text-[#999] text-xs leading-relaxed">{report.matchupNotes}</p>
                    </div>
                  )}
                </div>

                {/* Play Calling Analysis */}
                {report.playCalling && (
                  <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                    <h2 className="text-xl font-bold text-white mb-6">PLAY CALLING ANALYSIS</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-[#1a1a1a] rounded-xl p-5">
                        <h3 className="text-[#CDFD51] font-bold text-sm mb-4 uppercase tracking-wider">Offensive Play Calling</h3>
                        <div className="space-y-3">
                          {[
                            { label: 'Run/Pass Ratio', value: report.playCalling.offense?.runPassRatio },
                            { label: 'Down & Distance Tendencies', value: report.playCalling.offense?.tendencies },
                            { label: 'Red Zone Grade', value: report.playCalling.offense?.redZoneGrade },
                            { label: '3rd Down Grade', value: report.playCalling.offense?.thirdDownGrade },
                            { label: 'Predictability Score', value: report.playCalling.offense?.predictabilityScore },
                            { label: 'Wrong Calls', value: report.playCalling.offense?.wrongCalls },
                            { label: 'Recommendations', value: report.playCalling.offense?.recommendations },
                          ].map((item, i) => (
                            <div key={i}>
                              <div className="text-[#999] text-xs font-medium">{item.label}</div>
                              <div className="text-white text-sm mt-0.5">{item.value || '--'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-[#1a1a1a] rounded-xl p-5">
                        <h3 className="text-[#CDFD51] font-bold text-sm mb-4 uppercase tracking-wider">Defensive Play Calling</h3>
                        <div className="space-y-3">
                          {[
                            { label: 'Coverage Schemes', value: report.playCalling.defense?.coverageSchemes },
                            { label: 'Blitz Rate & Effectiveness', value: report.playCalling.defense?.blitzRate },
                            { label: 'Halftime Adjustments', value: report.playCalling.defense?.halftimeAdjustments },
                            { label: 'Vulnerabilities Exposed', value: report.playCalling.defense?.vulnerabilities },
                          ].map((item, i) => (
                            <div key={i}>
                              <div className="text-[#999] text-xs font-medium">{item.label}</div>
                              <div className="text-white text-sm mt-0.5">{item.value || '--'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Position Spotlight */}
                {report.positionSpotlight && report.positionSpotlight.length > 0 && (
                  <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-white">POSITION SPOTLIGHT</h2>
                    </div>
                    <p className="text-[#666] text-xs mb-6">AI-observed position group performance. Assign players to timestamps manually using the tag field — these save with your report.</p>
                    <div className="space-y-6">
                      {(report.positionSpotlight as any[]).map((pos: any, posIdx: number) => (
                        <div key={posIdx} className="bg-[#1a1a1a] rounded-xl p-5">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-[#CDFD51]/20 text-[#CDFD51] rounded-full text-xs font-bold">{pos.position}</span>
                              <GradeBadge grade={pos.grade || 'DEVELOPING'} />
                            </div>
                          </div>
                          <p className="text-[#ccc] text-sm mb-4 leading-relaxed">{pos.summary}</p>
                          {pos.keyPlays && pos.keyPlays.length > 0 && (
                            <div className="space-y-3">
                              <div className="text-[#666] text-xs font-semibold uppercase tracking-wider mb-2">Key Plays</div>
                              {pos.keyPlays.map((play: any, playIdx: number) => {
                                const tagKey = `${posIdx}-${playIdx}`;
                                return (
                                  <div key={playIdx} className="bg-[#2a2a2a] rounded-lg p-3 flex flex-col sm:flex-row sm:items-start gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[#CDFD51] text-xs font-bold font-mono">{play.timestamp}</span>
                                      </div>
                                      <p className="text-[#ccc] text-xs leading-relaxed">{play.description}</p>
                                    </div>
                                    <div className="sm:w-48 flex-shrink-0">
                                      <label className="block text-[#666] text-[10px] mb-1">Assign Player</label>
                                      <input
                                        type="text"
                                        value={playerTags[tagKey] ?? (play.playerTag || '')}
                                        onChange={e => updatePlayerTag(posIdx, playIdx, e.target.value)}
                                        placeholder="Player name / #"
                                        className="w-full bg-[#1a1a1a] border border-[#444] rounded px-2 py-1.5 text-white text-xs placeholder-[#555] focus:border-[#CDFD51] focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>

            {/* Coach Notes */}
            <div 
              id="coach-notes-section" 
              className={`bg-[#2a2a2a] rounded-2xl border p-6 transition-all duration-500 ${
                highlightNotes 
                  ? 'border-transparent ring-2 ring-[#CDFD51] shadow-[0_0_20px_rgba(205,253,81,0.6)] bg-[#CDFD51]/5' 
                  : 'border-[#333]'
              }`}
            >
              <h2 className="text-lg font-bold text-white mb-4">Coach Notes</h2>
              <textarea
                value={coachNotes}
                onChange={e => setCoachNotes(e.target.value)}
                placeholder="Add your own notes about this game..."
                rows={5}
                className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-4 py-3 text-white text-sm placeholder-[#666] focus:border-[#CDFD51] focus:outline-none resize-none"
              />
              <div className="flex gap-3 mt-4 flex-wrap">
                <button
                  onClick={handleSaveReport}
                  disabled={saved}
                  className={`flex-1 min-w-[140px] py-3 rounded-lg font-semibold text-sm transition-all ${
                    saved ? 'bg-[#CDFD51]/20 text-[#CDFD51] border border-[#CDFD51]/30' : 'bg-[#CDFD51] text-[#1a1a1a] hover:bg-[#b8e845]'
                  }`}
                >
                  {saved ? 'Game Report Saved' : 'Save Game Report'}
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-6 py-3 border border-[#CDFD51] text-[#CDFD51] rounded-lg font-semibold text-sm hover:bg-[#CDFD51]/10 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share with Staff
                </button>
                <button
                  onClick={exportReport}
                  className="px-6 py-3 border border-[#555] text-white rounded-lg font-semibold text-sm hover:border-[#CDFD51] hover:text-[#CDFD51] transition-colors"
                >
                  Export Report
                </button>
              </div>
            </div>
          </div>
        )}

        {report?.error && (
          <div className="bg-[#2a2a2a] rounded-2xl border border-red-500/30 p-8 text-center">
            <p className="text-red-400 font-medium mb-2">Analysis Failed</p>
            <p className="text-[#999] text-sm">{report.error}</p>
          </div>
        )}

        {/* Past Reports */}
        {pastReports.length > 0 && !report && (
          <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6 mt-8">
            <h2 className="text-lg font-bold text-white mb-4">Past Game Reports</h2>
            <div className="space-y-2">
              {pastReports.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-[#1a1a1a] rounded-lg p-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-[#666] text-xs">{r.date}</span>
                    <span className="text-white text-sm font-medium">{r.teamName} vs {r.opponent}</span>
                    <span className="px-2 py-0.5 bg-[#CDFD51]/10 text-[#CDFD51] rounded text-xs">{r.gameType}</span>
                  </div>
                  <span className="text-white font-bold text-sm">{r.report?.overallGrade || '--'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ShareReportModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        reportType="coach_report"
        reportData={getShareData()}
      />
    </div>
  );
};

export default Coaches;
