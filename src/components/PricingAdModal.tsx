import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PricingAdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingAdModal: React.FC<PricingAdModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    // Redirect to home to prevent access to the feature
    navigate('/');
  };

  const tiers = [
    {
      badge: 'PLAYER',
      price: '$9',
      popular: false,
      features: ['4 games/month', 'Personal profile', 'QB metrics'],
      cta: 'Choose Player',
    },
    {
      badge: 'COACH',
      price: '$29',
      popular: true,
      features: ['Unlimited games', 'Coach Dashboard', '22 players'],
      cta: 'Choose Coach',
    },
    {
      badge: 'PROGRAM',
      price: '$99',
      popular: false,
      features: ['Full roster', 'Unlimited staff', 'Recruiting exports'],
      cta: 'Choose Program',
    },
  ];

  const handleSelectPlan = () => {
    onClose();
    navigate('/pricing');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#000]/95 backdrop-blur-md"
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-5xl bg-[#1a1a1a] rounded-[32px] border border-[#333] shadow-[0_0_80px_rgba(205,253,81,0.1)] overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-[#333] text-white flex items-center justify-center hover:bg-[#CDFD51] hover:text-[#1a1a1a] transition-all duration-300 shadow-xl"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-8 md:p-12 text-center">
          <div className="mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Premium <span className="text-[#CDFD51]">Coaching</span> Access
            </h2>
            <p className="text-[#999] text-sm md:text-base max-w-2xl mx-auto">
              You must be on a premium plan to use the AI Film Analysis tool. Choose a plan below to continue.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <div 
                key={tier.badge}
                onClick={handleSelectPlan}
                className={`group cursor-pointer relative bg-[#222] rounded-2xl p-6 border transition-all duration-300 hover:border-[#CDFD51] hover:-translate-y-2 ${
                  tier.popular ? 'border-[#CDFD51]/50 shadow-[0_0_30px_rgba(205,253,81,0.1)]' : 'border-[#333]'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#CDFD51] text-[#1a1a1a] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                    Most Popular
                  </div>
                )}
                
                <div className="text-xs font-bold text-[#666] mb-2 group-hover:text-[#CDFD51] transition-colors">{tier.badge}</div>
                <div className="mb-4">
                  <span className="text-3xl font-black text-white">{tier.price}</span>
                  <span className="text-[#666] text-xs">/mo</span>
                </div>

                <ul className="space-y-3 mb-8 text-left">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-[#999] text-[11px]">
                      <svg className="w-3.5 h-3.5 text-[#CDFD51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
                  tier.popular 
                    ? 'bg-[#CDFD51] text-[#1a1a1a]' 
                    : 'bg-[#333] text-white group-hover:bg-[#CDFD51] group-hover:text-[#1a1a1a]'
                }`}>
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>

          <p className="mt-10 text-[#555] text-[10px] font-medium uppercase tracking-widest">
            Join 500+ elite coaching programs developing legends
          </p>
        </div>
      </div>
    </div>
  );
};

export default PricingAdModal;
