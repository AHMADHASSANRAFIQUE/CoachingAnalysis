import React, { useState } from 'react';

const faqs = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'What is LEGEND?',
        a: 'LEGEND is an AI-powered football coaching analysis platform. Coaches and players upload game film via YouTube URL and receive detailed, position-specific feedback — including play-by-play breakdowns, grading, and areas for growth.',
      },
      {
        q: 'How do I get started?',
        a: 'Create an account, choose your role (Player or Coach), and paste a YouTube link to your game film. For player analysis, provide your position, timestamps where you appear, and jersey color. For coach analysis, provide your team name, jersey color, and opponent.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes. Every plan includes a free tier so you can try the platform before committing. Free users get 1 analysis per month. Paid plans unlock unlimited analyses and additional features.',
      },
    ],
  },
  {
    category: 'Film Analysis',
    items: [
      {
        q: 'Why do I need to provide timestamps?',
        a: 'Timestamps are critical for player analysis. Without them, the AI cannot reliably distinguish your player from others at the same position. Provide the timestamps (e.g., 01:24, 03:45) where your player is clearly on the field.',
      },
      {
        q: 'Why was the roster field removed from Coach Analysis?',
        a: 'We found that providing a roster was causing the AI to fabricate player-specific data rather than reading the actual film. Coach Analysis now focuses on position groups and observable play-by-play evidence, which is more accurate and consistent.',
      },
      {
        q: 'Why does the analysis sometimes feel inconsistent?',
        a: 'We use a temperature of 0.0 in our AI model to maximize consistency. If you run the same film twice and get different results, it is usually because the AI is interpreting ambiguous visual information differently. Providing jersey color and clear timestamps significantly improves consistency.',
      },
      {
        q: 'What does the Position Spotlight show?',
        a: 'The Position Spotlight breaks down each position group (QB, WR, RB, OL, DL, LB, DB) based on what the AI directly observed in the film. It includes a grade, a summary, and key play timestamps. Coaches can manually assign a player name to each timestamp — those tags save with the report.',
      },
      {
        q: 'Does this work for all positions?',
        a: 'Yes. LEGEND provides position-specific analysis for QB, WR, RB, TE, OL, DL, LB, DB, and K/P. Each position gets tailored feedback categories and grading criteria.',
      },
    ],
  },
  {
    category: 'Saving & History',
    items: [
      {
        q: 'How do I save a report?',
        a: 'After analysis completes, click "Save Game Report" (Coach) or "Save to Player Profile" (Player). Reports are saved to your Supabase database when logged in, or to local storage if you are not signed in.',
      },
      {
        q: 'Where can I find past reports?',
        a: 'Go to the History page from the navigation bar. Coach reports and player film sessions are both accessible there. You can view or delete any past report.',
      },
      {
        q: 'Do player tags on the Position Spotlight save?',
        a: 'Yes. When you click "Save Game Report," the player tags you have assigned to each timestamp are saved as part of the report. They will appear when you view the report from History.',
      },
      {
        q: 'Does the Player Profile save history?',
        a: 'Yes. When you click "Save to Player Profile" after a film analysis, the session is saved to your game history. You can view it under Player Profile, where it shows season stats, performance trends, and a full game history log.',
      },
    ],
  },
  {
    category: 'Pricing & Billing',
    items: [
      {
        q: 'What plans are available?',
        a: 'LEGEND offers three plans: Player ($9/mo — 4 games/month, personal profile), Coach ($29/mo — unlimited games, full coach dashboard, up to 22 players), and Program ($99/mo — full roster, unlimited staff, recruiting exports).',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes. There are no long-term contracts or cancellation fees. Cancel at any time from your account settings.',
      },
      {
        q: 'Are promotional codes available?',
        a: 'Yes. Promotional codes can be created and managed by the LEGEND team. Contact us directly to request a promo code for your program or event.',
      },
    ],
  },
  {
    category: 'Privacy & Security',
    items: [
      {
        q: 'Is my film data secure?',
        a: 'Yes. All data is encrypted in transit and at rest via Supabase. Your game film links and player data are private and never shared with other programs.',
      },
      {
        q: 'Can I share a report with my staff?',
        a: 'Yes. Use the "Share with Staff" button after analysis to generate a shareable link. You can set the link to expire in 24 hours, 7 days, or never.',
      },
    ],
  },
];

const FAQ: React.FC = () => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggle = (key: string) => setOpenItem(prev => (prev === key ? null : key));

  return (
    <div className="font-lexend min-h-screen pt-4">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-[#999] text-lg">Everything you need to know about LEGEND.</p>
        </div>

        <div className="space-y-10">
          {faqs.map(section => (
            <div key={section.category}>
              <h2 className="text-[#CDFD51] text-xs font-bold uppercase tracking-widest mb-4">{section.category}</h2>
              <div className="space-y-2">
                {section.items.map((item, i) => {
                  const key = `${section.category}-${i}`;
                  const isOpen = openItem === key;
                  return (
                    <div
                      key={key}
                      className={`bg-[#2a2a2a] rounded-xl border transition-colors ${isOpen ? 'border-[#CDFD51]/30' : 'border-[#333]'}`}
                    >
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left"
                      >
                        <span className="text-white font-medium text-sm pr-4">{item.q}</span>
                        <svg
                          className={`w-4 h-4 text-[#CDFD51] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5">
                          <p className="text-[#999] text-sm leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-[#2a2a2a] rounded-2xl border border-[#333] p-8 text-center">
          <h3 className="text-white font-bold text-lg mb-2">Still have questions?</h3>
          <p className="text-[#999] text-sm">Reach out and we will get back to you as soon as possible.</p>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
