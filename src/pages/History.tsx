import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGameSessions, getCoachReports, GameSession, CoachGameReport, deleteGameSession, deleteCoachReport } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

const History: React.FC = () => {
  const { user, isCoach } = useAuth();
  const navigate = useNavigate();
  const [playerHistory, setPlayerHistory] = useState<GameSession[]>([]);
  const [coachHistory, setCoachHistory] = useState<CoachGameReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isCoach) {
        const reports = await getCoachReports();
        setCoachHistory(reports);
      } else {
        const sessions = await getGameSessions();
        setPlayerHistory(sessions);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isCoach]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) return;
    
    const success = isCoach ? await deleteCoachReport(id) : await deleteGameSession(id);
    if (success) {
      fetchData();
    }
  };

  const handleViewReport = (report: any, type: 'player' | 'coach') => {
    if (type === 'player') {
      // Save to sessionStorage so FilmAnalysis can load it
      sessionStorage.setItem('last_analysis', JSON.stringify({
        youtubeUrl: report.youtubeUrl,
        playerName: report.playerName,
        teamName: report.teamName,
        results: report.feedback
      }));
      navigate('/film-analysis');
    } else {
      // Save to sessionStorage so Coaches can load it
      sessionStorage.setItem('last_coach_analysis', JSON.stringify({
        youtubeUrl: report.youtubeUrl,
        teamName: report.teamName,
        opponent: report.opponent,
        report: report.report
      }));
      navigate('/coaches');
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-12 px-4 sm:px-6 lg:px-8 font-lexend">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">RECENT <span className="text-[#CDFD51]">ANALYSIS</span></h1>
            <p className="text-[#999] mt-2">Access your past breakdowns and coaching reports.</p>
          </div>
          <div className="hidden sm:block">
            <div className="px-4 py-2 bg-[#CDFD51]/10 rounded-full border border-[#CDFD51]/20">
              <span className="text-[#CDFD51] text-xs font-bold uppercase tracking-widest">{isCoach ? 'Coach' : 'Player'} History</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#333] border-t-[#CDFD51] rounded-full animate-spin mb-4" />
            <p className="text-[#666] animate-pulse">Fetching your history...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {isCoach ? (
              coachHistory.length > 0 ? (
                coachHistory.map((report) => (
                  <div 
                    key={report.id} 
                    className="group bg-[#2a2a2a] border border-[#333] hover:border-[#CDFD51]/50 p-6 rounded-2xl transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-[#CDFD51] uppercase tracking-wider">{report.gameType}</span>
                        <span className="text-[#666] text-xs">•</span>
                        <span className="text-[#999] text-xs">{new Date(report.date).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-[#CDFD51] transition-colors">
                        {report.teamName} vs {report.opponent}
                      </h3>
                      <p className="text-[#666] text-sm mt-1 truncate max-w-md">{report.youtubeUrl}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block mr-4">
                        <div className="text-xs text-[#666] uppercase font-bold">Grade</div>
                        <div className="text-[#CDFD51] font-black text-xl">{report.report?.overallGrade || 'N/A'}</div>
                      </div>
                      <button 
                        onClick={() => handleViewReport(report, 'coach')}
                        className="px-6 py-3 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-xl hover:bg-[#b8e845] shadow-lg shadow-[#CDFD51]/10 transition-all active:scale-95"
                      >
                        View Report
                      </button>
                      <button 
                        onClick={(e) => handleDelete(report.id, e)}
                        className="p-3 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        title="Delete analysis"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="No coach reports found. Start an analysis to see it here." />
              )
            ) : (
              playerHistory.length > 0 ? (
                playerHistory.map((session) => (
                  <div 
                    key={session.id} 
                    className="group bg-[#2a2a2a] border border-[#333] hover:border-[#CDFD51]/50 p-6 rounded-2xl transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-[#CDFD51] uppercase tracking-wider">{session.position} Analysis</span>
                        <span className="text-[#666] text-xs">•</span>
                        <span className="text-[#999] text-xs">{new Date(session.date).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-[#CDFD51] transition-colors">
                        {session.playerName} - {session.teamName}
                      </h3>
                      <p className="text-[#666] text-sm mt-1 truncate max-w-md">{session.youtubeUrl}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden md:block mr-4">
                        <div className="text-xs text-[#666] uppercase font-bold">Grade</div>
                        <div className="text-[#CDFD51] font-black text-xl">{session.overallGrade || 'N/A'}</div>
                      </div>
                      <button 
                        onClick={() => handleViewReport(session, 'player')}
                        className="px-6 py-3 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-xl hover:bg-[#b8e845] shadow-lg shadow-[#CDFD51]/10 transition-all active:scale-95"
                      >
                        View Breakdown
                      </button>
                      <button 
                        onClick={(e) => handleDelete(session.id, e)}
                        className="p-3 text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                        title="Delete analysis"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="No analysis history found. Upload a video to get started." />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-[#2a2a2a] border border-dashed border-[#333] rounded-3xl p-20 text-center">
    <div className="w-20 h-20 bg-[#333] rounded-full flex items-center justify-center mx-auto mb-6">
      <svg className="w-10 h-10 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <p className="text-[#999] max-w-xs mx-auto">{message}</p>
  </div>
);

export default History;
