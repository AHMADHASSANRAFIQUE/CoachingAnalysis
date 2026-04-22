import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="font-lexend">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center text-center px-4 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-[#1a1a1a]">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#CDFD51]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#CDFD51]/3 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#CDFD51]/30 bg-[#CDFD51]/5 mb-8">
            <div className="w-2 h-2 rounded-full bg-[#CDFD51] animate-pulse" />
            <span className="text-[#CDFD51] text-xs font-medium tracking-widest uppercase">AI-POWERED COACHING PLATFORM</span>
          </div>

          {/* Heading */}
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-black text-[#CDFD51] tracking-tight leading-none mb-4">
            LEGEND
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-6">
            AI-Powered Football Coaching
          </h2>
          <p className="text-[#999] text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Break down film. Grade players. Develop champions. The future of youth and high school football development starts here.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/film-analysis"
              className="px-8 py-4 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-all duration-300 hover:shadow-[0_0_30px_rgba(205,253,81,0.3)] tracking-wide"
            >
              Analyze Film Now
            </Link>
            <Link
              to="/pricing"
              className="px-8 py-4 border border-[#555] text-white font-bold text-sm rounded-lg hover:border-[#CDFD51] hover:text-[#CDFD51] transition-all duration-300 tracking-wide"
            >
              View Pricing
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '10K+', label: 'FILM SESSIONS ANALYZED' },
              { value: '500+', label: 'PROGRAMS USING LEGEND' },
              { value: '98%', label: 'COACH SATISFACTION' },
              { value: '2.4s', label: 'AVG ANALYSIS TIME' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-[#666] text-[10px] sm:text-xs tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#CDFD51] text-xs font-semibold tracking-[0.2em] uppercase">CORE FEATURES</span>
            <h3 className="text-3xl sm:text-4xl font-bold text-white mt-3">Everything Your Program Needs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Film Analysis Card */}
            <div className="group bg-[#2a2a2a] rounded-2xl p-8 border border-[#333] hover:border-[#CDFD51]/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-[#CDFD51]/10 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#CDFD51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Film Analysis</h4>
              <p className="text-[#999] text-sm leading-relaxed mb-6">
                Upload game film and get instant AI-powered breakdowns with play-by-play coaching feedback tailored to each position.
              </p>
              <Link to="/film-analysis" className="text-[#CDFD51] text-sm font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                Explore
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Player Grading Card */}
            <div className="group bg-[#2a2a2a] rounded-2xl p-8 border border-[#333] hover:border-[#CDFD51]/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-[#CDFD51]/10 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#CDFD51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Player Grading</h4>
              <p className="text-[#999] text-sm leading-relaxed mb-6">
                Comprehensive player evaluations with position-specific grading, performance tracking, and age-appropriate benchmarks.
              </p>
              <Link to="/player-profile" className="text-[#CDFD51] text-sm font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                Explore
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Coach Dashboard Card */}
            <div className="group bg-[#2a2a2a] rounded-2xl p-8 border border-[#333] hover:border-[#CDFD51]/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-[#CDFD51]/10 flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-[#CDFD51]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white mb-3">Coach Dashboard</h4>
              <p className="text-[#999] text-sm leading-relaxed mb-6">
                Full team overview with roster management, performance trends, and game-by-game analytics for your entire program.
              </p>
              <Link to="/dashboard" className="text-[#CDFD51] text-sm font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                Explore
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-[#111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#CDFD51] text-xs font-semibold tracking-[0.2em] uppercase">HOW IT WORKS</span>
            <h3 className="text-3xl sm:text-4xl font-bold text-white mt-3">Three Steps to Better Coaching</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload Film',
                desc: 'Paste a YouTube link to your game film. Tag your players with jersey numbers and visual identifiers for precise tracking.',
              },
              {
                step: '02',
                title: 'AI Analysis',
                desc: 'Our AI coach analyzes every play with position-specific feedback, grading mechanics, decision-making, and technique.',
              },
              {
                step: '03',
                title: 'Develop Players',
                desc: 'Track progress over the season with detailed reports, benchmark comparisons, and actionable coaching recommendations.',
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center md:text-left">
                <div className="text-6xl font-black text-[#CDFD51]/10 mb-4">{item.step}</div>
                <h4 className="text-xl font-bold text-white mb-3">{item.title}</h4>
                <p className="text-[#999] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[#CDFD51] text-xs font-semibold tracking-[0.2em] uppercase">TESTIMONIALS</span>
            <h3 className="text-3xl sm:text-4xl font-bold text-white mt-3">Trusted by Coaches Nationwide</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "LEGEND transformed how we prepare for games. The AI film analysis catches things our coaching staff misses. Our players' technique has improved dramatically since we started using it.",
                name: 'Coach Marcus Williams',
                role: 'Head Coach, Westfield High School',
              },
              {
                quote: "As a parent, I love seeing my son's progress tracked over the season. The age-appropriate feedback is exactly what young players need — encouraging but technically precise.",
                name: 'Sarah Johnson',
                role: 'Football Parent & Booster Club President',
              },
              {
                quote: "We've used every film tool on the market. LEGEND is the only one built specifically for youth and high school football. The position-specific grading is a game changer for player development.",
                name: 'Coach David Chen',
                role: 'Offensive Coordinator, Lincoln Academy',
              },
            ].map((testimonial) => (
              <div key={testimonial.name} className="bg-[#2a2a2a] rounded-2xl p-8 border border-[#333]">
                <svg className="w-8 h-8 text-[#CDFD51]/30 mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-[#ccc] text-sm leading-relaxed mb-6">{testimonial.quote}</p>
                <div>
                  <div className="text-white font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-[#666] text-xs mt-1">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-[#111]">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Build Legends?</h3>
          <p className="text-[#999] text-lg mb-10">
            Join hundreds of programs already using LEGEND to develop the next generation of football talent.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="px-8 py-4 bg-[#CDFD51] text-[#1a1a1a] font-bold text-sm rounded-lg hover:bg-[#b8e845] transition-all duration-300 hover:shadow-[0_0_30px_rgba(205,253,81,0.3)] tracking-wide"
            >
              Start Free Today
            </Link>
            <Link
              to="/pricing"
              className="px-8 py-4 border border-[#555] text-white font-bold text-sm rounded-lg hover:border-[#CDFD51] hover:text-[#CDFD51] transition-all duration-300 tracking-wide"
            >
              Compare Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
