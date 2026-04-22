import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Pricing: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tiers = [
    {
      badge: 'PLAYER',
      price: '$9',
      subtitle: '$9/mo — 4 games/month, personal profile, QB metrics',
      popular: false,
      features: [
        '4 games/month analysis',
        'Personal player profile',
        'QB metrics & real-time stats',
        'Game history & benchmarks',
        'Position-specific AI feedback',
        'Mobile-friendly reports',
      ],
      cta: 'Start as Player',
      ctaStyle: 'border border-[#555] text-white hover:border-[#CDFD51] hover:text-[#CDFD51]',
    },
    {
      badge: 'COACH',
      price: '$29',
      subtitle: '$29/mo (Most Popular) — Unlimited games, Coach Dashboard, 22 players',
      popular: true,
      features: [
        'Unlimited game analysis',
        'Full Coach Dashboard',
        'Up to 22 player profiles',
        '3 Challenges / 3 Wins analysis',
        'Play calling analysis',
        'Export staff reports',
        'Priority processing',
      ],
      cta: 'Start as Coach',
      ctaStyle: 'bg-[#CDFD51] text-[#1a1a1a] hover:bg-[#b8e845]',
    },
    {
      badge: 'PROGRAM',
      price: '$99',
      subtitle: '$99/mo — Full roster, unlimited staff, recruiting exports',
      popular: false,
      features: [
        'Full roster management',
        'Unlimited coaching staff',
        'Recruiting data exports',
        'Advanced program analytics',
        'Custom program branding',
        'Priority dedicated support',
      ],
      cta: 'Start as Program',
      ctaStyle: 'border border-[#555] text-white hover:border-[#CDFD51] hover:text-[#CDFD51]',
    },
  ];

  const faqs = [
    {
      q: 'Is there a free trial?',
      a: 'Yes! Every plan comes with a 14-day free trial. No credit card required to start. Experience the full power of LEGEND before committing.',
    },
    {
      q: 'Can I cancel anytime?',
      a: 'Absolutely. There are no long-term contracts or cancellation fees. You can cancel your subscription at any time from your account settings.',
    },
    {
      q: 'Is my film data secure?',
      a: 'Yes, all film data is encrypted in transit and at rest. Your game film and player data are completely private and never shared with other programs.',
    },
    {
      q: 'Does this work for all positions?',
      a: 'Yes! LEGEND provides position-specific analysis for QB, WR, RB, TE, OL, DL, LB, DB, and K/P. Each position gets tailored feedback categories and grading criteria.',
    },
  ];

  return (
    <div className="font-lexend min-h-screen pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-[#999] text-lg">Start free. Scale as your program grows.</p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {tiers.map((tier) => (
            <div
              key={tier.badge}
              className={`relative bg-[#2a2a2a] rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${
                tier.popular ? 'border-[#CDFD51]/50 shadow-[0_0_40px_rgba(205,253,81,0.1)]' : 'border-[#333]'
              }`}
            >
              {/* Badge */}
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mb-6 ${
                tier.popular
                  ? 'bg-[#CDFD51] text-[#1a1a1a]'
                  : 'bg-[#333] text-[#999]'
              }`}>
                {tier.badge}
              </div>

              {/* Price */}
              <div className="mb-2">
                <span className="text-4xl font-black text-white">{tier.price}</span>
                <span className="text-[#999] text-sm">/mo</span>
              </div>
              <p className="text-[#999] text-sm mb-8">{tier.subtitle}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#CDFD51] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[#ccc] text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                to="/login"
                className={`block w-full py-3 rounded-lg font-bold text-sm text-center transition-all duration-300 ${tier.ctaStyle}`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-[#2a2a2a] rounded-xl border border-[#333] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-white font-medium text-sm">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-[#666] transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-[#999] text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
