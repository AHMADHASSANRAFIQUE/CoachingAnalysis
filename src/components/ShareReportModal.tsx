import React, { useState } from 'react';
import { createSharedReport } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'film_analysis' | 'coach_report';
  reportData: any;
}

const ShareReportModal: React.FC<ShareReportModalProps> = ({ isOpen, onClose, reportType, reportData }) => {
  const { user } = useAuth();
  const [expiry, setExpiry] = useState<'24h' | '7d' | 'permanent'>('7d');
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!user) {
      setError('You must be logged in to share reports');
      return;
    }

    setLoading(true);
    setError('');
    setCopied(false);

    try {
      const id = await createSharedReport(reportType, reportData, expiry);
      if (id) {
        const url = `${window.location.origin}/shared/${id}`;
        setShareUrl(url);
      } else {
        setError('Failed to create share link. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const expiryLabel = {
    '24h': '24 Hours',
    '7d': '7 Days',
    'permanent': 'Never (Permanent)',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#2a2a2a] rounded-2xl border border-[#444] w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#CDFD51]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#CDFD51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Share Report</h3>
              <p className="text-[#999] text-xs">
                {reportType === 'film_analysis' ? 'Film Analysis Report' : 'Coach Game Report'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {!shareUrl ? (
            <>
              {/* Expiry Selection */}
              <div>
                <label className="block text-white text-sm font-medium mb-3">Link Expires After</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['24h', '7d', 'permanent'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => setExpiry(opt)}
                      className={`py-3 rounded-lg text-sm font-medium transition-all ${
                        expiry === opt
                          ? 'bg-[#CDFD51] text-[#1a1a1a]'
                          : 'bg-[#1a1a1a] text-[#999] border border-[#444] hover:border-[#CDFD51] hover:text-white'
                      }`}
                    >
                      {opt === '24h' ? '24 Hours' : opt === '7d' ? '7 Days' : 'Permanent'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="bg-[#1a1a1a] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#CDFD51] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-[#ccc] text-sm">Anyone with the link can view this report without logging in.</p>
                    <p className="text-[#666] text-xs mt-1">
                      Link expires: {expiryLabel[expiry]}
                    </p>
                  </div>
                </div>
              </div>

              {!user && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-400 text-xs">You must be logged in to share reports. Please sign in first.</p>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={handleShare}
                disabled={loading || !user}
                className="w-full py-3 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating Link...
                  </span>
                ) : (
                  'Generate Share Link'
                )}
              </button>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-[#CDFD51]/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#CDFD51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-white font-bold text-lg mb-1">Link Created!</h4>
                <p className="text-[#999] text-sm">Share this link with anyone to view the report</p>
              </div>

              {/* URL Display */}
              <div className="bg-[#1a1a1a] rounded-lg p-3 flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-white text-sm font-mono truncate focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    copied
                      ? 'bg-[#CDFD51]/20 text-[#CDFD51]'
                      : 'bg-[#CDFD51] text-[#1a1a1a] hover:bg-[#b8e845]'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <p className="text-[#666] text-xs text-center">
                {expiry === 'permanent' ? 'This link will never expire' : `Expires in ${expiry === '24h' ? '24 hours' : '7 days'}`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareReportModal;
