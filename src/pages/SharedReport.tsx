import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSharedReport } from '@/lib/storage';

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

const SharedReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [createdAt, setCreatedAt] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      if (!id) {
        setError('Invalid report link');
        setLoading(false);
        return;
      }

      try {
        const result = await getSharedReport(id);
        if (!result) {
          setError('Report not found. It may have been deleted or the link is invalid.');
          setLoading(false);
          return;
        }

        if (result.expired) {
          setExpired(true);
          setLoading(false);
          return;
        }

        setReportType(result.reportType);
        setReportData(result.reportData);
        setCreatedAt(result.createdAt);
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <div className="font-lexend min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#333] border-t-[#CDFD51] rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white font-medium">Loading Report...</p>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="font-lexend min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Link Expired</h2>
          <p className="text-[#999] text-sm mb-6">This shared report link has expired. Ask the sender to generate a new link.</p>
          <Link to="/" className="inline-flex px-6 py-3 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-colors">
            Go to LEGEND
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="font-lexend min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Report Not Found</h2>
          <p className="text-[#999] text-sm mb-6">{error}</p>
          <Link to="/" className="inline-flex px-6 py-3 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-colors">
            Go to LEGEND
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '';

  return (
    <div className="font-lexend min-h-screen pt-4 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#CDFD51]/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-[#CDFD51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Link to="/" className="text-[#CDFD51] font-bold text-lg">LEGEND</Link>
                  <span className="text-[#666]">/</span>
                  <span className="text-white text-sm font-medium">Shared Report</span>
                </div>
                <p className="text-[#666] text-xs mt-0.5">
                  {reportType === 'film_analysis' ? 'Film Analysis Report' : 'Coach Game Report'} &middot; Shared {formattedDate}
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-[#CDFD51]/10 text-[#CDFD51] rounded-full text-xs font-semibold border border-[#CDFD51]/20">
              Read Only
            </span>
          </div>
        </div>

        {/* Film Analysis Report */}
        {reportType === 'film_analysis' && reportData && (
          <div className="space-y-6">
            {/* Player Header */}
            <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{reportData.playerName || 'Player'}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="px-3 py-1 bg-[#CDFD51]/20 text-[#CDFD51] rounded-full text-xs font-bold">{reportData.position || 'N/A'}</span>
                    {reportData.teamName && <span className="text-[#999] text-sm">{reportData.teamName}</span>}
                    {reportData.age && <span className="text-[#666] text-sm">{reportData.age}</span>}
                  </div>
                </div>
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black ${
                    reportData.results?.overallGrade === 'ELITE' ? 'bg-[#CDFD51]/20 text-[#CDFD51]' :
                    reportData.results?.overallGrade === 'DEVELOPING' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {reportData.results?.letterGrade || 'B'}
                  </div>
                  <div className="mt-1">
                    <GradeBadge grade={reportData.results?.overallGrade || 'DEVELOPING'} />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            {reportData.stats && Object.keys(reportData.stats).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(reportData.stats).filter(([_, v]) => (v as number) > 0).map(([key, val]) => (
                  <div key={key} className="bg-[#2a2a2a] rounded-xl border border-[#333] p-4">
                    <div className="text-[#999] text-xs mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    <div className="text-white text-2xl font-bold">{val as number}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Overview */}
            {reportData.results?.overview && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                <h3 className="text-lg font-bold text-white mb-4">Overview</h3>
                <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{reportData.results.overview}</p>
                {reportData.results.categories && (
                  <div className="space-y-3 mt-6">
                    {reportData.results.categories.map((cat: any, i: number) => (
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

            {/* Play-by-Play */}
            {reportData.results?.plays && reportData.results.plays.length > 0 && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                <h3 className="text-lg font-bold text-white mb-4">Play-by-Play</h3>
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
                      {reportData.results.plays.map((play: any, i: number) => (
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
              </div>
            )}

            {/* Areas for Growth */}
            {reportData.results?.areasForGrowth && reportData.results.areasForGrowth.length > 0 && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                <h3 className="text-lg font-bold text-white mb-4">Areas for Growth</h3>
                <div className="space-y-4">
                  {reportData.results.areasForGrowth.map((area: any, i: number) => (
                    <div key={i} className="bg-[#1a1a1a] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium text-sm">{area.area}</span>
                        <GradeBadge grade={area.currentLevel} />
                      </div>
                      <p className="text-[#999] text-xs leading-relaxed">{area.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Coach Report */}
        {reportType === 'coach_report' && reportData && (
          <div className="space-y-6">
            {/* Game Info Header */}
            <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {reportData.teamName || 'Team'} vs {reportData.opponent || 'Opponent'}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    {reportData.date && <span className="text-[#999] text-sm">{reportData.date}</span>}
                    {reportData.gameType && (
                      <span className="px-3 py-1 bg-[#CDFD51]/10 text-[#CDFD51] rounded-full text-xs font-semibold">{reportData.gameType}</span>
                    )}
                  </div>
                </div>
                {reportData.report?.overallGrade && (
                  <div className="text-center">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black ${
                      reportData.report.gradeLabel === 'ELITE' ? 'bg-[#CDFD51]/20 text-[#CDFD51]' :
                      reportData.report.gradeLabel === 'DEVELOPING' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {reportData.report.overallGrade}
                    </div>
                    <div className="mt-1">
                      <GradeBadge grade={reportData.report.gradeLabel || 'DEVELOPING'} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Challenges */}
            {reportData.report?.challenges && reportData.report.challenges.length > 0 && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-red-500/20 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  3 Biggest Challenges
                </h3>
                <div className="space-y-4">
                  {reportData.report.challenges.map((c: any, i: number) => (
                    <div key={i} className="bg-[#1a1a1a] rounded-xl p-5 border-l-4 border-red-500/50">
                      <h4 className="text-white font-semibold mb-2">{c.title}</h4>
                      <p className="text-[#ccc] text-sm mb-2">{c.description}</p>
                      {c.recommendation && (
                        <div className="bg-red-500/5 rounded-lg p-3 mt-2">
                          <p className="text-red-300 text-xs"><span className="font-semibold">Recommendation:</span> {c.recommendation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wins */}
            {reportData.report?.wins && reportData.report.wins.length > 0 && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#CDFD51]/20 p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#CDFD51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  3 Things That Went Best
                </h3>
                <div className="space-y-4">
                  {reportData.report.wins.map((w: any, i: number) => (
                    <div key={i} className="bg-[#1a1a1a] rounded-xl p-5 border-l-4 border-[#CDFD51]/50">
                      <h4 className="text-white font-semibold mb-2">{w.title}</h4>
                      <p className="text-[#ccc] text-sm mb-2">{w.description}</p>
                      {w.buildOn && (
                        <div className="bg-[#CDFD51]/5 rounded-lg p-3 mt-2">
                          <p className="text-[#CDFD51]/80 text-xs"><span className="font-semibold">Build On:</span> {w.buildOn}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assessment */}
            {reportData.report?.assessment && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                <h3 className="text-xl font-bold text-white mb-4">Overall Game Assessment</h3>
                <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{reportData.report.assessment}</p>
              </div>
            )}

            {/* Player Spotlight */}
            {reportData.report?.topPerformers && reportData.report.topPerformers.length > 0 && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                <h3 className="text-xl font-bold text-white mb-4">Player Spotlight</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {reportData.report.topPerformers.map((p: any, i: number) => (
                    <div key={i} className="bg-[#1a1a1a] rounded-xl p-5 text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-lg font-bold ${
                        i === 0 ? 'bg-[#CDFD51] text-[#1a1a1a]' : 'bg-[#444] text-white'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="text-white font-bold">{p.name}</div>
                      <div className="text-[#CDFD51] text-xs font-medium mt-1">{p.position} - Grade: {p.grade}</div>
                      <p className="text-[#999] text-xs mt-2">{p.highlights}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coach Notes */}
            {reportData.coachNotes && (
              <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-6">
                <h3 className="text-lg font-bold text-white mb-4">Coach Notes</h3>
                <p className="text-[#ccc] text-sm leading-relaxed whitespace-pre-wrap">{reportData.coachNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <div className="bg-[#2a2a2a] rounded-2xl border border-[#333] p-8">
            <h3 className="text-xl font-bold text-white mb-2">Want AI-powered film analysis for your team?</h3>
            <p className="text-[#999] text-sm mb-6">LEGEND uses AI to break down every play with coaching-grade feedback.</p>
            <Link to="/" className="inline-flex px-8 py-3 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-colors">
              Try LEGEND Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedReport;
