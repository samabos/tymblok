import { useState, useEffect } from 'react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/50' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="header-bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1"/>
                <stop offset="1" stopColor="#a855f7"/>
              </linearGradient>
            </defs>
            <rect width="512" height="512" rx="108" fill="url(#header-bg)"/>
            <g transform="translate(136, 116)">
              <rect x="0" y="0" width="8" height="280" rx="4" fill="white" fillOpacity="0.9"/>
              <rect x="20" y="0" width="100" height="52" rx="12" fill="white"/>
              <rect x="20" y="68" width="150" height="52" rx="12" fill="white" fillOpacity="0.9"/>
              <rect x="20" y="136" width="200" height="52" rx="12" fill="white" fillOpacity="0.8"/>
              <rect x="20" y="204" width="220" height="52" rx="12" fill="white" fillOpacity="0.7"/>
            </g>
          </svg>
          <span className="font-bold text-lg">Tymblok</span>
        </a>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors">How It Works</a>
        </nav>

        {/* CTA */}
        <a
          href="#waitlist"
          className="h-9 px-4 rounded-lg gradient-bg text-sm font-semibold text-white hover:opacity-90 transition-all flex items-center"
        >
          Join Waitlist
        </a>
      </div>
    </header>
  );
}
