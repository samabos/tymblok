import React, { useState, useEffect, useRef } from 'react';

// ============================================
// ICONS
// ============================================
const Icons = {
  github: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  ),
  jira: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z" />
    </svg>
  ),
  users: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  ),
  check: (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  ),
  inbox: (
    <svg
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
      />
    </svg>
  ),
  chartBar: (
    <svg
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  ),
  cog: (
    <svg
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  calendar: (
    <svg
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  ),
  pause: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
    </svg>
  ),
  play: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
      />
    </svg>
  ),
  back: (
    <svg
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  ),
  sun: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  ),
  moon: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  ),
  system: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
      />
    </svg>
  ),
  contrast: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v18m0-18a9 9 0 019 9 9 9 0 01-9 9m0-18a9 9 0 00-9 9 9 9 0 009 9"
      />
    </svg>
  ),
  motion: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    </svg>
  ),
  text: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
      />
    </svg>
  ),
  user: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  ),
  bell: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  ),
  link: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
      />
    </svg>
  ),
  shield: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  ),
  help: (
    <svg
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
      />
    </svg>
  ),
  chevronRight: (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  ),
};

// ============================================
// MAIN APP
// ============================================
const TymblokApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [activeTab, setActiveTab] = useState('today');
  const [subScreen, setSubScreen] = useState(null); // 'profile' | 'integrations' | null
  const [theme, setTheme] = useState('dark');
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [textSize, setTextSize] = useState('medium');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial load
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const isDark = theme === 'dark' || theme === 'system';

  const themeStyles = {
    bg: isDark ? 'bg-slate-950' : 'bg-slate-50',
    cardBg: isDark ? 'bg-slate-900' : 'bg-white',
    cardBgSubtle: isDark ? 'bg-slate-900/50' : 'bg-white/80',
    border: isDark ? 'border-slate-800' : 'border-slate-200',
    borderSubtle: isDark ? 'border-slate-800/30' : 'border-slate-100',
    text: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-600',
    textFaint: isDark ? 'text-slate-500' : 'text-slate-400',
    hover: isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100',
    inputBg: isDark ? 'bg-slate-800' : 'bg-slate-100',
  };

  // Show onboarding for new users
  if (!isAuthenticated && showOnboarding) {
    return (
      <OnboardingScreen
        themeStyles={themeStyles}
        isDark={isDark}
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    if (authScreen === 'signup') {
      return (
        <SignUpScreen
          themeStyles={themeStyles}
          isDark={isDark}
          onSignUp={() => setIsAuthenticated(true)}
          onBack={() => setAuthScreen('login')}
        />
      );
    }
    if (authScreen === 'forgot') {
      return (
        <ForgotPasswordScreen
          themeStyles={themeStyles}
          isDark={isDark}
          onBack={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <LoginScreen
        themeStyles={themeStyles}
        isDark={isDark}
        onLogin={() => setIsAuthenticated(true)}
        onSignUp={() => setAuthScreen('signup')}
        onForgot={() => setAuthScreen('forgot')}
      />
    );
  }

  return (
    <div className={`h-screen ${themeStyles.bg} ${themeStyles.text} antialiased overflow-hidden`}>
      <style>{`
        @keyframes subtle-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        .focus-pulse { animation: ${reduceMotion ? 'none' : 'subtle-pulse 3s ease-in-out infinite'}; }
        @keyframes progress-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .progress-shimmer { background: linear-gradient(90deg, #4f46e5 0%, #6366f1 50%, #4f46e5 100%); background-size: 200% 100%; animation: ${reduceMotion ? 'none' : 'progress-shimmer 2s ease-in-out infinite'}; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes now-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        .now-badge { animation: ${reduceMotion ? 'none' : 'now-pulse 2s ease-in-out infinite'}; }
        .card-hover { transition: ${reduceMotion ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease'}; }
        .card-hover:hover { transform: ${reduceMotion ? 'none' : 'translateY(-2px)'}; }
        .card-hover:active { transform: ${reduceMotion ? 'none' : 'translateY(0) scale(0.98)'}; }
        .btn-press { transition: ${reduceMotion ? 'none' : 'transform 0.1s ease'}; }
        .btn-press:active { transform: ${reduceMotion ? 'none' : 'scale(0.92)'}; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .task-card { animation: ${reduceMotion ? 'none' : 'fadeSlideIn 0.3s ease forwards'}; }
        .dragging { opacity: 0.5; transform: scale(1.02); }
        .toggle-switch { transition: ${reduceMotion ? 'none' : 'background-color 0.2s ease'}; }
        .toggle-knob { transition: ${reduceMotion ? 'none' : 'transform 0.2s ease'}; }
        .screen-transition { transition: ${reduceMotion ? 'none' : 'transform 0.3s ease, opacity 0.3s ease'}; }
      `}</style>

      {/* Screen Container */}
      <div className="h-full relative">
        {/* Today Screen */}
        <div
          className={`absolute inset-0 screen-transition ${activeTab === 'today' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}
        >
          <TodayScreen
            themeStyles={themeStyles}
            isDark={isDark}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            reduceMotion={reduceMotion}
            onSelectTask={setSelectedTask}
          />
        </div>

        {/* Inbox Screen */}
        <div
          className={`absolute inset-0 screen-transition ${activeTab === 'inbox' ? 'translate-x-0 opacity-100' : activeTab === 'today' ? 'translate-x-full opacity-0 pointer-events-none' : '-translate-x-full opacity-0 pointer-events-none'}`}
        >
          <InboxScreen themeStyles={themeStyles} isDark={isDark} />
        </div>

        {/* Stats Screen */}
        <div
          className={`absolute inset-0 screen-transition ${activeTab === 'stats' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}
        >
          <StatsScreen themeStyles={themeStyles} isDark={isDark} />
        </div>

        {/* Settings Screen */}
        <div
          className={`absolute inset-0 screen-transition ${activeTab === 'settings' && !subScreen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}
        >
          <SettingsScreen
            themeStyles={themeStyles}
            isDark={isDark}
            theme={theme}
            setTheme={setTheme}
            highContrast={highContrast}
            setHighContrast={setHighContrast}
            reduceMotion={reduceMotion}
            setReduceMotion={setReduceMotion}
            textSize={textSize}
            setTextSize={setTextSize}
            onBack={() => setActiveTab('today')}
            onLogout={() => setIsAuthenticated(false)}
            onProfile={() => setSubScreen('profile')}
            onIntegrations={() => setSubScreen('integrations')}
          />
        </div>

        {/* Profile Screen */}
        <div
          className={`absolute inset-0 screen-transition ${subScreen === 'profile' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}
        >
          <ProfileScreen
            themeStyles={themeStyles}
            isDark={isDark}
            onBack={() => setSubScreen(null)}
            onLogout={() => {
              setSubScreen(null);
              setIsAuthenticated(false);
            }}
          />
        </div>

        {/* Integrations Screen */}
        <div
          className={`absolute inset-0 screen-transition ${subScreen === 'integrations' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}
        >
          <IntegrationsScreen
            themeStyles={themeStyles}
            isDark={isDark}
            onBack={() => setSubScreen(null)}
          />
        </div>
      </div>

      {/* Bottom Navigation - Only show on Today, Inbox, Stats */}
      {activeTab !== 'settings' && !subScreen && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          themeStyles={themeStyles}
          isDark={isDark}
          onAddClick={() => setShowAddModal(true)}
        />
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          themeStyles={themeStyles}
          isDark={isDark}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          themeStyles={themeStyles}
          isDark={isDark}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* Loading Screen */}
      {isLoading && <LoadingScreen themeStyles={themeStyles} isDark={isDark} />}
    </div>
  );
};

// ============================================
// ONBOARDING SCREEN
// ============================================
const OnboardingScreen = ({ themeStyles, isDark, onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: (
        <svg className="w-16 h-16" viewBox="0 0 48 48" fill="none">
          <rect x="14" y="6" width="20" height="8" rx="2" fill="white" fillOpacity="0.4" />
          <rect x="14" y="16" width="20" height="8" rx="2" fill="white" fillOpacity="0.6" />
          <rect x="14" y="26" width="20" height="8" rx="2" fill="white" fillOpacity="0.8" />
          <rect x="14" y="36" width="20" height="8" rx="2" fill="white" />
          <path
            d="M10 10v28"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
          <circle cx="10" cy="30" r="2" fill="white" />
        </svg>
      ),
      title: 'Time Blocking Made Simple',
      description: 'Plan your day with visual time blocks. See exactly where your time goes.',
    },
    {
      icon: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 48 48">
          <path
            d="M14 12L8 24L14 36"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M34 12L40 24L34 36"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="24" r="8" stroke="white" strokeWidth="2.5" fill="none" />
          <path
            d="M24 20v4l3 2"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: 'Built for Developers',
      description: 'Integrates with GitHub, Jira, and your calendar. Your tasks, one place.',
    },
    {
      icon: (
        <svg className="w-16 h-16" fill="none" viewBox="0 0 48 48">
          <rect
            x="8"
            y="8"
            width="32"
            height="32"
            rx="8"
            stroke="white"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M16 24l6 6 10-12"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: 'Focus & Ship',
      description: 'Track your deep work, build streaks, and see your productivity grow.',
    },
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} flex flex-col`}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .float-animation { animation: float 4s ease-in-out infinite; }
      `}</style>

      {/* Skip button */}
      <div className="p-6 flex justify-end">
        <button
          onClick={onComplete}
          className={`text-sm font-medium ${themeStyles.textMuted} hover:${themeStyles.text}`}
        >
          Skip
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pb-12">
        {/* Icon */}
        <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-12 float-animation">
          {slides[currentSlide].icon}
        </div>

        {/* Text */}
        <h1 className="text-2xl font-bold text-center mb-3">{slides[currentSlide].title}</h1>
        <p className={`text-center ${themeStyles.textMuted} max-w-xs`}>
          {slides[currentSlide].description}
        </p>
      </div>

      {/* Bottom */}
      <div className="p-8">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentSlide ? 'w-6 bg-indigo-500' : isDark ? 'bg-slate-700' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Button */}
        <button
          onClick={nextSlide}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all"
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

// ============================================
// SIGN UP SCREEN
// ============================================
const SignUpScreen = ({ isDark, themeStyles, onSignUp, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSignUp();
    }, 1000);
  };

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} antialiased flex flex-col`}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .float-animation { animation: float 6s ease-in-out infinite; }
        .btn-press { transition: transform 0.1s ease; }
        .btn-press:active { transform: scale(0.98); }
      `}</style>

      {/* Ambient gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] ${isDark ? 'bg-indigo-600/15' : 'bg-indigo-500/10'} rounded-full blur-[120px]`}
        />
        <div
          className={`absolute -bottom-40 -right-40 w-[400px] h-[400px] ${isDark ? 'bg-purple-600/10' : 'bg-purple-500/5'} rounded-full blur-[100px]`}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 relative">
        {/* Back button */}
        <button
          onClick={onBack}
          className={`absolute top-8 left-6 p-2 rounded-xl ${themeStyles.hover}`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-5 float-animation">
            <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none">
              <rect x="14" y="6" width="20" height="8" rx="2" fill="white" fillOpacity="0.4" />
              <rect x="14" y="16" width="20" height="8" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="14" y="26" width="20" height="8" rx="2" fill="white" fillOpacity="0.8" />
              <rect x="14" y="36" width="20" height="8" rx="2" fill="white" />
              <path
                d="M10 10v28"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.5"
              />
              <circle cx="10" cy="30" r="2" fill="white" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className={`mt-1 ${themeStyles.textMuted}`}>Start blocking your time today</p>
        </div>

        {/* Sign Up Form */}
        <div
          className={`${themeStyles.cardBg} rounded-3xl border ${themeStyles.border} p-6 ${!isDark ? 'shadow-xl shadow-slate-200/50' : ''}`}
        >
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${themeStyles.textMuted}`}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className={`w-full px-4 py-3 rounded-xl ${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${themeStyles.textMuted}`}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={`w-full px-4 py-3 rounded-xl ${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${themeStyles.textMuted}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl ${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${themeStyles.textFaint}`}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <p className={`text-xs ${themeStyles.textFaint} mt-2`}>
                Must be at least 8 characters
              </p>
            </div>

            {/* Sign Up Button */}
            <button
              type="button"
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all btn-press disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          {/* Terms */}
          <p className={`text-xs text-center ${themeStyles.textFaint} mt-4`}>
            By signing up, you agree to our <button className="text-indigo-500">Terms</button> and{' '}
            <button className="text-indigo-500">Privacy Policy</button>
          </p>
        </div>

        {/* Sign In Link */}
        <p className={`text-center mt-6 ${themeStyles.textMuted}`}>
          Already have an account?{' '}
          <button onClick={onBack} className="text-indigo-500 hover:text-indigo-400 font-semibold">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

// ============================================
// FORGOT PASSWORD SCREEN
// ============================================
const ForgotPasswordScreen = ({ isDark, themeStyles, onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSent(true);
    }, 1000);
  };

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} antialiased flex flex-col`}>
      {/* Ambient gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] ${isDark ? 'bg-indigo-600/15' : 'bg-indigo-500/10'} rounded-full blur-[120px]`}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 relative">
        {/* Back button */}
        <button
          onClick={onBack}
          className={`absolute top-8 left-6 p-2 rounded-xl ${themeStyles.hover}`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {sent ? (
          /* Success State */
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 mb-6">
              <svg
                className="w-8 h-8 text-emerald-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className={`${themeStyles.textMuted} mb-8`}>
              We sent a password reset link to
              <br />
              <span className="font-medium text-white">{email}</span>
            </p>
            <button
              onClick={onBack}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all"
            >
              Back to Sign in
            </button>
            <button className={`w-full py-3 mt-3 ${themeStyles.textMuted}`}>
              Didn't receive email? <span className="text-indigo-500 font-medium">Resend</span>
            </button>
          </div>
        ) : (
          /* Form State */
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 mb-5">
                <svg
                  className="w-7 h-7 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">Forgot Password?</h1>
              <p className={`mt-2 ${themeStyles.textMuted}`}>
                No worries, we'll send you reset instructions.
              </p>
            </div>

            <div
              className={`${themeStyles.cardBg} rounded-3xl border ${themeStyles.border} p-6 ${!isDark ? 'shadow-xl shadow-slate-200/50' : ''}`}
            >
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${themeStyles.textMuted}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className={`w-full px-4 py-3 rounded-xl ${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={onBack}
              className={`text-center mt-6 ${themeStyles.textMuted} flex items-center justify-center gap-2`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
              Back to Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================
// LOGIN SCREEN
// ============================================
const LoginScreen = ({ isDark, themeStyles, onLogin, onSignUp, onForgot }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1000);
  };

  return (
    <div className={`min-h-screen ${themeStyles.bg} ${themeStyles.text} antialiased flex flex-col`}>
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .float-animation { animation: float 6s ease-in-out infinite; }
        .btn-press { transition: transform 0.1s ease; }
        .btn-press:active { transform: scale(0.98); }
      `}</style>

      {/* Ambient gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] ${isDark ? 'bg-indigo-600/15' : 'bg-indigo-500/10'} rounded-full blur-[120px]`}
        />
        <div
          className={`absolute -bottom-40 -right-40 w-[400px] h-[400px] ${isDark ? 'bg-purple-600/10' : 'bg-purple-500/5'} rounded-full blur-[100px]`}
        />
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 relative">
        {/* Logo & Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-6 float-animation">
            <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
              {/* Block Tower Logo */}
              <rect x="14" y="6" width="20" height="8" rx="2" fill="white" fillOpacity="0.4" />
              <rect x="14" y="16" width="20" height="8" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="14" y="26" width="20" height="8" rx="2" fill="white" fillOpacity="0.8" />
              <rect x="14" y="36" width="20" height="8" rx="2" fill="white" />
              {/* Side time indicator */}
              <path
                d="M10 10v28"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeOpacity="0.5"
              />
              <circle cx="10" cy="30" r="2" fill="white" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Tymblok</h1>
          <p className={`mt-2 ${themeStyles.textMuted}`}>Time blocking for developers</p>
        </div>

        {/* Login Card */}
        <div
          className={`${themeStyles.cardBg} rounded-3xl border ${themeStyles.border} p-6 ${!isDark ? 'shadow-xl shadow-slate-200/50' : ''}`}
        >
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${themeStyles.textMuted}`}>
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={`w-full px-4 py-3 rounded-xl ${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                />
                <div
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${themeStyles.textFaint}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${themeStyles.textMuted}`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-xl ${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${themeStyles.textFaint} hover:text-slate-300 transition-colors`}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <button
                type="button"
                onClick={onForgot}
                className="text-sm text-indigo-500 hover:text-indigo-400 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all btn-press disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${themeStyles.border}`} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${themeStyles.cardBg} ${themeStyles.textFaint}`}>
                or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border ${themeStyles.border} ${themeStyles.hover} font-medium transition-all btn-press`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border ${themeStyles.border} ${themeStyles.hover} font-medium transition-all btn-press`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>
        </div>

        {/* Sign Up Link */}
        <p className={`text-center mt-8 ${themeStyles.textMuted}`}>
          Don't have an account?{' '}
          <button
            onClick={onSignUp}
            className="text-indigo-500 hover:text-indigo-400 font-semibold transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>

      {/* Footer */}
      <div className={`text-center py-6 ${themeStyles.textFaint} text-sm`}>
        <p>© 2026 Tymblok. All rights reserved.</p>
      </div>
    </div>
  );
};

// ============================================
// TODAY SCREEN
// ============================================
const TodayScreen = ({
  themeStyles,
  isDark,
  activeTab,
  setActiveTab,
  reduceMotion,
  onSelectTask,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 29));
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [headerExpanded, setHeaderExpanded] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Morning standup',
      subtitle: 'Engineering Team · Daily sync',
      time: '09:00',
      endTime: '09:15',
      type: 'meeting',
      completed: true,
    },
    {
      id: 2,
      title: 'Review authentication PR',
      subtitle: 'auth-module #234 · +180 -42',
      time: '09:30',
      endTime: '10:15',
      type: 'github',
      completed: true,
    },
    {
      id: 3,
      title: 'Sprint Planning',
      subtitle: 'Engineering Team · 5 attendees',
      time: '10:30',
      endTime: '11:30',
      type: 'meeting',
      elapsed: '32:15',
      progress: 54,
      isNow: true,
    },
    {
      id: 4,
      title: 'User settings implementation',
      subtitle: 'JIRA-892 · 5 story points',
      time: '13:00',
      endTime: '15:00',
      type: 'jira',
    },
    {
      id: 5,
      title: 'Code review session',
      subtitle: 'Review PRs from team',
      time: '15:30',
      endTime: '16:30',
      type: 'github',
      urgent: true,
    },
    {
      id: 6,
      title: 'API documentation update',
      subtitle: 'JIRA-901 · 2 story points',
      time: '17:00',
      endTime: '18:00',
      type: 'jira',
    },
  ]);
  const scrollRef = useRef(null);
  const currentTaskRef = useRef(null);

  const getTaskDuration = (startTime, endTime) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return endH * 60 + endM - (startH * 60 + startM);
  };

  const getTimeBlockHeight = duration => {
    const minHeight = 15;
    return Math.max(minHeight, Math.min(duration / 2, 60));
  };

  const handleDragStart = (e, taskId) => {
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    if (draggedId === null || draggedId === targetId) return;
    const draggedIndex = tasks.findIndex(t => t.id === draggedId);
    const targetIndex = tasks.findIndex(t => t.id === targetId);
    if (draggedIndex === targetIndex) return;
    const newTasks = [...tasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedTask);
    setTasks(newTasks);
  };

  const handleDragEnd = () => setDraggedId(null);

  useEffect(() => {
    if (currentTaskRef.current && !reduceMotion) {
      setTimeout(() => {
        currentTaskRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, []);

  const navigateDay = direction => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const getDaysCenteredOnToday = () => {
    const days = [];
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() + i);
      days.push({
        label: dayLabels[date.getDay()],
        num: date.getDate(),
        isToday: i === 0,
        offset: i,
      });
    }
    return days;
  };

  const formatDateHeader = date => ({
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
    monthDay: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
  });

  const getTypeConfig = type => {
    const configs = {
      github: {
        bgColor: isDark ? 'bg-emerald-500/15' : 'bg-emerald-100',
        textColor: isDark ? 'text-emerald-400' : 'text-emerald-700',
        borderColor: 'bg-emerald-500',
        icon: Icons.github,
        label: 'GitHub',
      },
      jira: {
        bgColor: isDark ? 'bg-blue-500/15' : 'bg-blue-100',
        textColor: isDark ? 'text-blue-400' : 'text-blue-700',
        borderColor: 'bg-blue-500',
        icon: Icons.jira,
        label: 'Jira',
      },
      meeting: {
        bgColor: isDark ? 'bg-purple-500/15' : 'bg-purple-100',
        textColor: isDark ? 'text-purple-400' : 'text-purple-700',
        borderColor: 'bg-purple-500',
        icon: Icons.users,
        label: 'Meeting',
      },
    };
    return configs[type];
  };

  const getDayStyle = offset => {
    const absOffset = Math.abs(offset);
    if (absOffset === 0) return { size: 'w-12 h-12', textSize: 'text-base', opacity: 1 };
    if (absOffset === 1) return { size: 'w-10 h-10', textSize: 'text-sm', opacity: 0.8 };
    if (absOffset === 2) return { size: 'w-8 h-8', textSize: 'text-xs', opacity: 0.6 };
    return { size: 'w-7 h-7', textSize: 'text-xs', opacity: 0.4 };
  };

  const handleCardClick = (taskId, isCompleted) => {
    if (isCompleted) return;
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
      if (!reduceMotion) {
        setTimeout(() => {
          const element = document.getElementById(`task-${taskId}`);
          if (element && scrollRef.current) {
            const container = scrollRef.current;
            const scrollTo =
              element.offsetTop -
              container.offsetTop -
              container.clientHeight / 2 +
              element.offsetHeight / 2;
            container.scrollTo({ top: scrollTo, behavior: 'smooth' });
          }
        }, 50);
      }
    }
  };

  const days = getDaysCenteredOnToday();
  const { weekday, monthDay } = formatDateHeader(currentDate);

  return (
    <div className="h-full flex flex-col pb-20">
      {/* Ambient gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] ${isDark ? 'bg-indigo-600/8' : 'bg-indigo-500/10'} rounded-full blur-[120px]`}
        />
      </div>

      {/* Header */}
      <div
        className={`relative flex-shrink-0 ${themeStyles.cardBgSubtle} backdrop-blur-xl rounded-b-3xl border-b ${themeStyles.borderSubtle} cursor-pointer`}
        onClick={() => setHeaderExpanded(!headerExpanded)}
      >
        <div className="px-5 pt-8 pb-3">
          <header className="flex items-start justify-between">
            <div>
              <p className={`text-xs ${themeStyles.textMuted} font-medium`}>{weekday}</p>
              <h1 className="text-xl font-bold mt-0.5">{monthDay}</h1>
              <p className={`text-[11px] ${themeStyles.textFaint} mt-0.5`}>
                {tasks.length} tasks · {tasks.filter(t => t.completed).length} done
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`transition-transform duration-300 ${headerExpanded ? 'rotate-180' : ''}`}
              >
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  className={themeStyles.textFaint}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
              <button className="relative" onClick={e => e.stopPropagation()}>
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white ring-2 ${isDark ? 'ring-slate-800' : 'ring-white shadow-md'}`}
                >
                  SA
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 ${isDark ? 'border-slate-950' : 'border-white'}`}
                />
              </button>
            </div>
          </header>
        </div>

        {/* Day Selector */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${headerExpanded ? 'max-h-20 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}
        >
          <div className="flex items-center justify-center gap-1.5 px-5">
            {days.map((day, i) => {
              const style = getDayStyle(day.offset);
              return (
                <button
                  key={i}
                  onClick={e => {
                    e.stopPropagation();
                    navigateDay(day.offset);
                  }}
                  className={`${style.size} rounded-full flex flex-col items-center justify-center transition-all duration-200 btn-press ${
                    day.isToday
                      ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30'
                      : `${themeStyles.cardBg} border ${themeStyles.border} ${themeStyles.hover}`
                  }`}
                  style={{ opacity: style.opacity }}
                >
                  <span
                    className={`font-semibold ${style.textSize} ${day.isToday ? 'text-white' : ''}`}
                  >
                    {day.num}
                  </span>
                  {day.isToday && (
                    <span className="text-[8px] text-indigo-200 font-medium -mt-0.5">
                      {day.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-4 pb-4">
        <div className="space-y-2.5">
          {tasks.map((task, index) => {
            const config = getTypeConfig(task.type);
            const isExpanded = expandedTaskId === task.id;
            const isCompleted = task.completed;
            const isCurrent = task.isNow;
            const duration = getTaskDuration(task.time, task.endTime);
            const isDragging = draggedId === task.id;

            return (
              <div
                key={task.id}
                id={`task-${task.id}`}
                ref={isCurrent ? currentTaskRef : null}
                draggable={!isCompleted}
                onDragStart={e => handleDragStart(e, task.id)}
                onDragOver={e => handleDragOver(e, task.id)}
                onDragEnd={handleDragEnd}
                onClick={() => handleCardClick(task.id, isCompleted)}
                className={`task-card relative rounded-2xl transition-all duration-200 ${!isCompleted ? 'cursor-grab active:cursor-grabbing card-hover' : ''} ${isDragging ? 'dragging' : ''} ${!isDark ? 'shadow-sm shadow-slate-200' : ''} ${
                  isCompleted
                    ? `${themeStyles.cardBg}/80 border ${themeStyles.border}/80`
                    : isExpanded
                      ? `${themeStyles.cardBg} border-2 border-indigo-500 shadow-lg shadow-indigo-500/20`
                      : isCurrent
                        ? `${themeStyles.cardBg} border border-indigo-500/50 shadow-md shadow-indigo-500/10`
                        : `${themeStyles.cardBg} border ${themeStyles.border} hover:shadow-md`
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {isExpanded && (
                  <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 focus-pulse" />
                )}
                <div
                  className={`absolute left-0 top-3 w-1 rounded-full ${isCompleted ? (isDark ? 'bg-slate-700' : 'bg-slate-300') : config.borderColor}`}
                  style={{ height: `${getTimeBlockHeight(duration)}px` }}
                />

                <div className="relative p-3.5">
                  <div className="flex items-start gap-3 pl-3">
                    <div className="w-12 flex-shrink-0 pt-0.5">
                      <span
                        className={`text-sm font-mono font-medium ${isCompleted ? themeStyles.textFaint : ''}`}
                      >
                        {task.time}
                      </span>
                      <span className={`block text-[10px] font-mono ${themeStyles.textFaint}`}>
                        {duration}m
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${isCompleted ? `${themeStyles.inputBg} ${themeStyles.textFaint}` : `${config.bgColor} ${config.textColor}`}`}
                        >
                          {config.icon}
                          {config.label}
                        </span>
                        {task.urgent && !isCompleted && (
                          <span
                            className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-600'}`}
                          >
                            Urgent
                          </span>
                        )}
                        {isCurrent && !isCompleted && (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded now-badge ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-indigo-400' : 'bg-indigo-500'}`}
                            />
                            Live
                          </span>
                        )}
                        {isCompleted && (
                          <span
                            className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-100 text-emerald-600'}`}
                          >
                            Done
                          </span>
                        )}
                      </div>
                      <h3
                        className={`text-[15px] font-semibold leading-tight ${isCompleted ? themeStyles.textMuted : ''}`}
                      >
                        {task.title}
                      </h3>
                      <p className={`text-xs mt-0.5 ${themeStyles.textFaint}`}>{task.subtitle}</p>
                    </div>
                    {/* Expand button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onSelectTask && onSelectTask(task);
                      }}
                      className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center ${themeStyles.hover} ${themeStyles.textFaint} hover:text-indigo-400 transition-colors`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                        />
                      </svg>
                    </button>
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-3 h-3 text-emerald-500"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      </div>
                    ) : (
                      <button
                        onClick={e => e.stopPropagation()}
                        className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${isExpanded ? 'bg-emerald-600 text-white' : `border ${themeStyles.border} ${themeStyles.textFaint} hover:border-indigo-500 hover:text-indigo-400`}`}
                      >
                        {isExpanded ? Icons.check : Icons.play}
                      </button>
                    )}
                  </div>
                  {isExpanded && !isCompleted && (
                    <div className={`mt-3 pt-3 border-t ${themeStyles.borderSubtle} pl-3`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-mono font-bold">
                            {task.elapsed || '00:00'}
                          </span>
                          <span className={`text-xs ${themeStyles.textFaint}`}>elapsed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={e => e.stopPropagation()}
                            className={`w-8 h-8 rounded-lg ${themeStyles.inputBg} ${themeStyles.hover} flex items-center justify-center ${themeStyles.textMuted} btn-press`}
                          >
                            {Icons.pause}
                          </button>
                          <button
                            onClick={e => e.stopPropagation()}
                            className="px-3 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white text-xs font-medium btn-press gap-1"
                          >
                            {Icons.check}Done
                          </button>
                        </div>
                      </div>
                      {task.progress !== undefined && (
                        <div className="mt-2.5">
                          <div
                            className={`h-1 ${themeStyles.inputBg} rounded-full overflow-hidden`}
                          >
                            <div
                              className="h-full rounded-full progress-shimmer"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button
          className={`w-full mt-3 mb-4 py-3 rounded-xl border border-dashed ${themeStyles.border} ${themeStyles.textFaint} text-sm font-medium ${themeStyles.hover} btn-press`}
        >
          + Add time block
        </button>
      </div>
    </div>
  );
};

// ============================================
// INBOX SCREEN
// ============================================
const InboxScreen = ({ themeStyles, isDark }) => {
  const [filter, setFilter] = useState('all');

  const inboxItems = [
    {
      id: 1,
      title: 'Review Q4 Planning Doc',
      source: 'google-drive',
      time: '2h ago',
      type: 'task',
    },
    {
      id: 2,
      title: 'JIRA-923: Fix login redirect',
      source: 'jira',
      time: '3h ago',
      type: 'task',
      priority: 'high',
    },
    {
      id: 3,
      title: 'Team standup moved to 10am',
      source: 'calendar',
      time: '5h ago',
      type: 'update',
    },
    { id: 4, title: 'PR #456 ready for review', source: 'github', time: '6h ago', type: 'task' },
    { id: 5, title: 'Weekly report due Friday', source: 'slack', time: '1d ago', type: 'reminder' },
  ];

  const sourceIcons = {
    'google-drive': (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 11L6 1h12l-6 10zm0 2l6 10H6l6-10zm-7.5.5L1 8l6-7 3.5 5.5-6 6zm15 0l-6-6L17 2l6 7-3.5 5.5z" />
      </svg>
    ),
    jira: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005z" />
      </svg>
    ),
    calendar: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        />
      </svg>
    ),
    github: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    slack: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" />
      </svg>
    ),
  };

  const sourceColors = {
    'google-drive': 'text-yellow-500 bg-yellow-500/15',
    jira: 'text-blue-500 bg-blue-500/15',
    calendar: 'text-purple-500 bg-purple-500/15',
    github: isDark ? 'text-white bg-white/15' : 'text-slate-800 bg-slate-800/15',
    slack: 'text-pink-500 bg-pink-500/15',
  };

  return (
    <div className="h-full flex flex-col pb-20">
      {/* Header */}
      <div
        className={`flex-shrink-0 ${themeStyles.cardBgSubtle} backdrop-blur-xl border-b ${themeStyles.borderSubtle}`}
      >
        <div className="px-5 pt-8 pb-4">
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className={`text-sm ${themeStyles.textMuted} mt-1`}>
            Tasks and updates from your integrations
          </p>
        </div>

        {/* Filter tabs */}
        <div className="px-5 pb-3 flex gap-2">
          {['all', 'tasks', 'updates'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : `${themeStyles.inputBg} ${themeStyles.textMuted} hover:${themeStyles.text}`
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Inbox Items */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-4">
        <div className="space-y-2">
          {inboxItems
            .filter(
              item =>
                filter === 'all' ||
                (filter === 'tasks' && item.type === 'task') ||
                (filter === 'updates' && item.type !== 'task')
            )
            .map(item => (
              <div
                key={item.id}
                className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4 flex items-start gap-3 transition-all hover:scale-[1.01] cursor-pointer`}
              >
                {/* Source icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sourceColors[item.source]}`}
                >
                  {sourceIcons[item.source]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium leading-tight">{item.title}</h3>
                    {item.priority === 'high' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 flex-shrink-0">
                        High
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${themeStyles.textFaint} mt-0.5`}>{item.time}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    className={`w-8 h-8 rounded-lg ${themeStyles.hover} flex items-center justify-center ${themeStyles.textMuted}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                  </button>
                  <button
                    className={`w-8 h-8 rounded-lg ${themeStyles.hover} flex items-center justify-center ${themeStyles.textMuted}`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
        </div>

        {/* Empty state hint */}
        <div className={`text-center py-8 ${themeStyles.textFaint}`}>
          <p className="text-sm">Tap + to add to today's schedule</p>
          <p className="text-sm">Tap × to dismiss</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STATS SCREEN
// ============================================
const StatsScreen = ({ themeStyles, isDark }) => {
  const weekData = [
    { day: 'Mon', hours: 6.5, completed: 8 },
    { day: 'Tue', hours: 7.2, completed: 10 },
    { day: 'Wed', hours: 5.8, completed: 7 },
    { day: 'Thu', hours: 8.1, completed: 12 },
    { day: 'Fri', hours: 6.0, completed: 9 },
    { day: 'Sat', hours: 2.5, completed: 3 },
    { day: 'Sun', hours: 1.0, completed: 2 },
  ];

  const maxHours = Math.max(...weekData.map(d => d.hours));

  const categoryBreakdown = [
    { name: 'Deep Work', hours: 18.5, color: 'bg-indigo-500', percent: 45 },
    { name: 'Meetings', hours: 12.0, color: 'bg-purple-500', percent: 29 },
    { name: 'Code Review', hours: 6.5, color: 'bg-emerald-500', percent: 16 },
    { name: 'Admin', hours: 4.1, color: 'bg-amber-500', percent: 10 },
  ];

  return (
    <div className="h-full flex flex-col pb-20">
      {/* Header */}
      <div
        className={`flex-shrink-0 ${themeStyles.cardBgSubtle} backdrop-blur-xl border-b ${themeStyles.borderSubtle}`}
      >
        <div className="px-5 pt-8 pb-4">
          <h1 className="text-2xl font-bold">Stats</h1>
          <p className={`text-sm ${themeStyles.textMuted} mt-1`}>Your productivity insights</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4`}>
            <p className={`text-sm ${themeStyles.textMuted}`}>This Week</p>
            <p className="text-3xl font-bold mt-1">
              37.1<span className="text-lg font-normal">h</span>
            </p>
            <p className="text-sm text-emerald-500 mt-1">↑ 12% vs last week</p>
          </div>
          <div className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4`}>
            <p className={`text-sm ${themeStyles.textMuted}`}>Tasks Done</p>
            <p className="text-3xl font-bold mt-1">51</p>
            <p className="text-sm text-emerald-500 mt-1">↑ 8 more than last week</p>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4`}>
          <h3 className="font-semibold mb-4">Daily Hours</h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {weekData.map((day, i) => (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col justify-end h-24">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      i === 3 ? 'bg-indigo-500' : isDark ? 'bg-slate-700' : 'bg-slate-200'
                    }`}
                    style={{ height: `${(day.hours / maxHours) * 100}%` }}
                  />
                </div>
                <span
                  className={`text-xs ${i === 3 ? 'text-indigo-400 font-semibold' : themeStyles.textFaint}`}
                >
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4`}>
          <h3 className="font-semibold mb-4">Time by Category</h3>
          <div className="space-y-3">
            {categoryBreakdown.map(cat => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{cat.name}</span>
                  <span className={`text-sm ${themeStyles.textMuted}`}>{cat.hours}h</span>
                </div>
                <div
                  className={`h-2 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} overflow-hidden`}
                >
                  <div
                    className={`h-full rounded-full ${cat.color}`}
                    style={{ width: `${cat.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streak */}
        <div className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${themeStyles.textMuted}`}>Current Streak</p>
              <p className="text-2xl font-bold mt-1">12 days 🔥</p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${themeStyles.textMuted}`}>Best Streak</p>
              <p className="text-2xl font-bold mt-1">28 days</p>
            </div>
          </div>
        </div>

        {/* Focus Score */}
        <div className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4`}>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke={isDark ? '#1e293b' : '#e2e8f0'}
                  strokeWidth="3"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  strokeDasharray="100"
                  strokeDashoffset="15"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">85</span>
              </div>
            </div>
            <div>
              <p className="font-semibold">Focus Score</p>
              <p className={`text-sm ${themeStyles.textMuted} mt-0.5`}>
                Based on deep work time and task completion
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SETTINGS SCREEN
// ============================================
const SettingsScreen = ({
  themeStyles,
  isDark,
  theme,
  setTheme,
  highContrast,
  setHighContrast,
  reduceMotion,
  setReduceMotion,
  textSize,
  setTextSize,
  onBack,
  onLogout,
  onProfile,
  onIntegrations,
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header
        className={`sticky top-0 z-10 ${themeStyles.cardBgSubtle} backdrop-blur-xl border-b ${themeStyles.borderSubtle}`}
      >
        <div className="px-5 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 -ml-2 rounded-xl ${themeStyles.hover} btn-press`}
          >
            {Icons.back}
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-6 space-y-6 pb-20">
        {/* Appearance */}
        <section>
          <h2
            className={`text-xs font-semibold uppercase tracking-wider ${themeStyles.textMuted} mb-3 px-1`}
          >
            Appearance
          </h2>
          <div
            className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} overflow-hidden`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${themeStyles.inputBg} flex items-center justify-center ${themeStyles.textMuted}`}
                  >
                    {theme === 'light' ? Icons.sun : theme === 'dark' ? Icons.moon : Icons.system}
                  </div>
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className={`text-sm ${themeStyles.textMuted}`}>
                      Choose your preferred theme
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'light', label: 'Light', icon: Icons.sun },
                  { id: 'dark', label: 'Dark', icon: Icons.moon },
                  { id: 'system', label: 'System', icon: Icons.system },
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`flex-1 flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all btn-press ${
                      theme === option.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : `${themeStyles.border} ${themeStyles.hover}`
                    }`}
                  >
                    <span
                      className={theme === option.id ? 'text-indigo-400' : themeStyles.textMuted}
                    >
                      {option.icon}
                    </span>
                    <span
                      className={`text-sm font-medium ${theme === option.id ? 'text-indigo-400' : ''}`}
                    >
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Accessibility */}
        <section>
          <h2
            className={`text-xs font-semibold uppercase tracking-wider ${themeStyles.textMuted} mb-3 px-1`}
          >
            Accessibility
          </h2>
          <div
            className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} overflow-hidden`}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl ${themeStyles.inputBg} flex items-center justify-center ${themeStyles.textMuted}`}
                >
                  {Icons.contrast}
                </div>
                <div>
                  <p className="font-medium">High Contrast</p>
                  <p className={`text-sm ${themeStyles.textMuted}`}>
                    Increase text and UI contrast
                  </p>
                </div>
              </div>
              <Toggle enabled={highContrast} onChange={setHighContrast} />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl ${themeStyles.inputBg} flex items-center justify-center ${themeStyles.textMuted}`}
                >
                  {Icons.motion}
                </div>
                <div>
                  <p className="font-medium">Reduce Motion</p>
                  <p className={`text-sm ${themeStyles.textMuted}`}>Minimize animations</p>
                </div>
              </div>
              <Toggle enabled={reduceMotion} onChange={setReduceMotion} />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`w-9 h-9 rounded-xl ${themeStyles.inputBg} flex items-center justify-center ${themeStyles.textMuted}`}
                >
                  {Icons.text}
                </div>
                <div>
                  <p className="font-medium">Text Size</p>
                  <p className={`text-sm ${themeStyles.textMuted}`}>Adjust font size</p>
                </div>
              </div>
              <div className={`flex rounded-xl ${themeStyles.inputBg} p-1`}>
                {[
                  { id: 'small', label: 'A', size: 'text-sm' },
                  { id: 'medium', label: 'A', size: 'text-base' },
                  { id: 'large', label: 'A', size: 'text-lg' },
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => setTextSize(option.id)}
                    className={`flex-1 py-2 rounded-lg font-semibold transition-all btn-press ${option.size} ${
                      textSize === option.id ? `${themeStyles.cardBg} shadow-sm` : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Account */}
        <section>
          <h2
            className={`text-xs font-semibold uppercase tracking-wider ${themeStyles.textMuted} mb-3 px-1`}
          >
            Account
          </h2>
          <div
            className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} overflow-hidden`}
          >
            <SettingsRow
              icon={Icons.user}
              label="Profile"
              sublabel="Manage your account"
              themeStyles={themeStyles}
              isFirst
              onClick={onProfile}
            />
            <SettingsRow
              icon={Icons.bell}
              label="Notifications"
              sublabel="Alerts and sounds"
              themeStyles={themeStyles}
            />
            <SettingsRow
              icon={Icons.calendar}
              label="Calendar Sync"
              sublabel="Google, Outlook"
              themeStyles={themeStyles}
            />
            <SettingsRow
              icon={Icons.link}
              label="Integrations"
              sublabel="GitHub, Jira, Slack"
              themeStyles={themeStyles}
              isLast
              onClick={onIntegrations}
            />
          </div>
        </section>

        {/* Support */}
        <section>
          <h2
            className={`text-xs font-semibold uppercase tracking-wider ${themeStyles.textMuted} mb-3 px-1`}
          >
            Support
          </h2>
          <div
            className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} overflow-hidden`}
          >
            <SettingsRow
              icon={Icons.help}
              label="Help Center"
              sublabel="FAQs and guides"
              themeStyles={themeStyles}
              isFirst
            />
            <SettingsRow
              icon={Icons.shield}
              label="Privacy"
              sublabel="Data and permissions"
              themeStyles={themeStyles}
              isLast
            />
          </div>
        </section>

        {/* Logout */}
        <section>
          <button
            onClick={onLogout}
            className={`w-full py-4 rounded-2xl border ${isDark ? 'border-red-500/30 bg-red-500/10' : 'border-red-200 bg-red-50'} text-red-500 font-medium transition-all hover:opacity-80 active:scale-[0.98]`}
          >
            Sign out
          </button>
        </section>

        <div className="text-center pt-4">
          <p className={`text-sm font-medium ${themeStyles.textMuted}`}>Tymblok</p>
          <p className={`text-xs ${themeStyles.textFaint}`}>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// PROFILE SCREEN
// ============================================
const ProfileScreen = ({ themeStyles, isDark, onBack, onLogout }) => {
  const [name, setName] = useState('Sam Abos');
  const [email, setEmail] = useState('sam@tymblok.dev');
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header
        className={`sticky top-0 z-10 ${themeStyles.cardBgSubtle} backdrop-blur-xl border-b ${themeStyles.borderSubtle}`}
      >
        <div className="px-5 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 -ml-2 rounded-xl ${themeStyles.hover} btn-press`}
          >
            {Icons.back}
          </button>
          <h1 className="text-xl font-bold">Profile</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-6 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-indigo-500/25">
              SA
            </div>
            <button
              className={`absolute bottom-0 right-0 w-8 h-8 rounded-full ${themeStyles.cardBg} border ${themeStyles.border} flex items-center justify-center shadow-lg`}
            >
              <svg
                className="w-4 h-4 text-indigo-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                />
              </svg>
            </button>
          </div>
          <h2 className="text-xl font-bold mt-4">{name}</h2>
          <p className={`${themeStyles.textMuted}`}>{email}</p>
        </div>

        {/* Personal Info */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2
              className={`text-xs font-semibold uppercase tracking-wider ${themeStyles.textMuted}`}
            >
              Personal Info
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-medium text-indigo-500"
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
          </div>
          <div
            className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} overflow-hidden`}
          >
            <div className="p-4">
              <label className={`block text-sm ${themeStyles.textMuted} mb-1`}>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg ${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
              ) : (
                <p className="font-medium">{name}</p>
              )}
            </div>
            <div className={`p-4 border-t ${themeStyles.borderSubtle}`}>
              <label className={`block text-sm ${themeStyles.textMuted} mb-1`}>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg ${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                />
              ) : (
                <p className="font-medium">{email}</p>
              )}
            </div>
          </div>
        </section>

        {/* Stats Summary */}
        <section>
          <h2
            className={`text-xs font-semibold uppercase tracking-wider ${themeStyles.textMuted} mb-3 px-1`}
          >
            Activity
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div
              className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4 text-center`}
            >
              <p className="text-2xl font-bold">156</p>
              <p className={`text-xs ${themeStyles.textMuted}`}>Tasks Done</p>
            </div>
            <div
              className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4 text-center`}
            >
              <p className="text-2xl font-bold">12</p>
              <p className={`text-xs ${themeStyles.textMuted}`}>Day Streak</p>
            </div>
            <div
              className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4 text-center`}
            >
              <p className="text-2xl font-bold">89h</p>
              <p className={`text-xs ${themeStyles.textMuted}`}>This Month</p>
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <section>
          <h2
            className={`text-xs font-semibold uppercase tracking-wider ${themeStyles.textMuted} mb-3 px-1`}
          >
            Account
          </h2>
          <div
            className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} overflow-hidden`}
          >
            <button className={`w-full p-4 flex items-center justify-between ${themeStyles.hover}`}>
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl ${themeStyles.inputBg} flex items-center justify-center ${themeStyles.textMuted}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
                <span className="font-medium">Change Password</span>
              </div>
              <span className={themeStyles.textFaint}>{Icons.chevronRight}</span>
            </button>
            <button
              className={`w-full p-4 flex items-center justify-between border-t ${themeStyles.borderSubtle} ${themeStyles.hover}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl ${themeStyles.inputBg} flex items-center justify-center ${themeStyles.textMuted}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15"
                    />
                  </svg>
                </div>
                <span className="font-medium">Export Data</span>
              </div>
              <span className={themeStyles.textFaint}>{Icons.chevronRight}</span>
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="pb-8">
          <h2
            className={`text-xs font-semibold uppercase tracking-wider ${themeStyles.textMuted} mb-3 px-1`}
          >
            Danger Zone
          </h2>
          <div
            className={`${themeStyles.cardBg} rounded-2xl border ${isDark ? 'border-red-500/30' : 'border-red-200'} overflow-hidden`}
          >
            <button onClick={onLogout} className="w-full p-4 flex items-center gap-3 text-red-500">
              <div
                className={`w-9 h-9 rounded-xl ${isDark ? 'bg-red-500/15' : 'bg-red-50'} flex items-center justify-center`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                  />
                </svg>
              </div>
              <span className="font-medium">Sign Out</span>
            </button>
            <button
              className={`w-full p-4 flex items-center gap-3 text-red-500 border-t ${isDark ? 'border-red-500/30' : 'border-red-200'}`}
            >
              <div
                className={`w-9 h-9 rounded-xl ${isDark ? 'bg-red-500/15' : 'bg-red-50'} flex items-center justify-center`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </div>
              <span className="font-medium">Delete Account</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

// ============================================
// INTEGRATIONS SCREEN
// ============================================
const IntegrationsScreen = ({ themeStyles, isDark, onBack }) => {
  const [integrations, setIntegrations] = useState({
    github: true,
    jira: true,
    googleCalendar: false,
    slack: false,
    notion: false,
    linear: false,
  });

  const toggleIntegration = key => {
    setIntegrations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const integrationsList = [
    {
      id: 'github',
      name: 'GitHub',
      description: 'Sync PRs and issues',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
      ),
      color: isDark ? 'text-white' : 'text-slate-900',
      bgColor: isDark ? 'bg-white/10' : 'bg-slate-100',
    },
    {
      id: 'jira',
      name: 'Jira',
      description: 'Import tickets and sprints',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z" />
        </svg>
      ),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/15',
    },
    {
      id: 'googleCalendar',
      name: 'Google Calendar',
      description: 'Sync events and meetings',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22 12l-10 8V4l10 8z" />
          <path fill="#34A853" d="M12 20l-8-6V4l8 6v10z" />
          <path fill="#FBBC05" d="M4 4h8v6H4V4z" />
          <path fill="#EA4335" d="M12 10h8v8h-8v-8z" />
        </svg>
      ),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/15',
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get notifications and updates',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path
            fill="#E01E5A"
            d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52z"
          />
          <path
            fill="#36C5F0"
            d="M6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
          />
          <path
            fill="#2EB67D"
            d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834z"
          />
          <path
            fill="#ECB22E"
            d="M8.834 6.313a2.527 2.527 0 0 1 2.521 2.521 2.527 2.527 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
          />
        </svg>
      ),
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/15',
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Import pages and databases',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.22.186c-.094-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.514.28-.887.747-.933l3.222-.187zM2.332.467L16.09-.32c1.54-.14 1.960.093 2.943.84l4.018 2.8c.654.466.887.84.887 1.4v16.47c0 1.167-.42 1.867-1.867 1.96l-15.83.934c-1.073.047-1.587-.093-2.147-.793L1.217 19.62c-.467-.607-.654-1.073-.654-1.773V2.334c0-.84.374-1.54 1.214-1.68l.555-.187z" />
        </svg>
      ),
      color: isDark ? 'text-white' : 'text-slate-900',
      bgColor: isDark ? 'bg-white/10' : 'bg-slate-100',
    },
    {
      id: 'linear',
      name: 'Linear',
      description: 'Sync issues and projects',
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.357 3.357a1.378 1.378 0 0 0 0 1.95l15.336 15.336a1.378 1.378 0 0 0 1.95-1.95L5.307 3.357a1.378 1.378 0 0 0-1.95 0z" />
          <path
            d="M20.693 12a8.693 8.693 0 1 1-17.386 0 8.693 8.693 0 0 1 17.386 0z"
            fillOpacity="0.4"
          />
        </svg>
      ),
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/15',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header
        className={`sticky top-0 z-10 ${themeStyles.cardBgSubtle} backdrop-blur-xl border-b ${themeStyles.borderSubtle}`}
      >
        <div className="px-5 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className={`p-2 -ml-2 rounded-xl ${themeStyles.hover} btn-press`}
          >
            {Icons.back}
          </button>
          <h1 className="text-xl font-bold">Integrations</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 py-6 space-y-4">
        <p className={`text-sm ${themeStyles.textMuted} mb-4`}>
          Connect your tools to automatically import tasks and sync your workflow.
        </p>

        {integrationsList.map(integration => (
          <div
            key={integration.id}
            className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4 flex items-center gap-4`}
          >
            <div
              className={`w-12 h-12 rounded-xl ${integration.bgColor} flex items-center justify-center ${integration.color}`}
            >
              {integration.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{integration.name}</h3>
                {integrations[integration.id] && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500">
                    Connected
                  </span>
                )}
              </div>
              <p className={`text-sm ${themeStyles.textMuted}`}>{integration.description}</p>
            </div>
            <button
              onClick={() => toggleIntegration(integration.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                integrations[integration.id]
                  ? `${themeStyles.inputBg} ${themeStyles.textMuted}`
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {integrations[integration.id] ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}

        {/* API Key */}
        <div className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4 mt-6`}>
          <h3 className="font-semibold mb-2">API Key</h3>
          <p className={`text-sm ${themeStyles.textMuted} mb-3`}>
            Use your API key to connect custom integrations.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value="tb_sk_1234567890abcdef"
              readOnly
              className={`flex-1 px-3 py-2 rounded-lg ${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} font-mono text-sm`}
            />
            <button
              className={`px-4 py-2 rounded-lg ${themeStyles.inputBg} ${themeStyles.textMuted} font-medium text-sm`}
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTS
// ============================================
const Toggle = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative w-12 h-7 rounded-full toggle-switch btn-press ${enabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
    role="switch"
    aria-checked={enabled}
  >
    <span
      className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm toggle-knob ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

const SettingsRow = ({ icon, label, sublabel, themeStyles, isFirst, isLast, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full p-4 flex items-center justify-between transition-opacity hover:opacity-80 active:opacity-60 btn-press ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''}`}
  >
    <div className="flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl ${themeStyles.inputBg} flex items-center justify-center ${themeStyles.textMuted}`}
      >
        {icon}
      </div>
      <div className="text-left">
        <p className="font-medium">{label}</p>
        <p className={`text-sm ${themeStyles.textMuted}`}>{sublabel}</p>
      </div>
    </div>
    <span className={themeStyles.textFaint}>{Icons.chevronRight}</span>
  </button>
);

const BottomNav = ({ activeTab, setActiveTab, themeStyles, isDark, onAddClick }) => (
  <nav
    className={`absolute bottom-0 left-0 right-0 ${themeStyles.cardBgSubtle} backdrop-blur-xl border-t ${themeStyles.borderSubtle}`}
  >
    <div className="max-w-lg mx-auto px-4 py-2 pb-7 flex items-center justify-around">
      <NavItem
        icon={Icons.calendar}
        label="Today"
        active={activeTab === 'today'}
        onClick={() => setActiveTab('today')}
      />
      <NavItem
        icon={Icons.inbox}
        label="Inbox"
        badge={5}
        active={activeTab === 'inbox'}
        onClick={() => setActiveTab('inbox')}
      />
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onAddClick}
          className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 text-white"
        >
          {Icons.plus}
        </button>
        <span className="text-[10px] font-medium text-indigo-400">Add</span>
      </div>
      <NavItem
        icon={Icons.chartBar}
        label="Stats"
        active={activeTab === 'stats'}
        onClick={() => setActiveTab('stats')}
      />
      <NavItem
        icon={Icons.cog}
        label="Settings"
        active={activeTab === 'settings'}
        onClick={() => setActiveTab('settings')}
      />
    </div>
  </nav>
);

const NavItem = ({ icon, label, active, badge, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 btn-press ${active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
  >
    <div
      className={`relative h-6 flex items-center justify-center transition-transform ${active ? 'scale-110' : ''}`}
    >
      {icon}
      {badge && (
        <span className="absolute -top-1 -right-2.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

// ============================================
// ADD TASK MODAL
// ============================================
const AddTaskModal = ({ themeStyles, isDark, onClose }) => {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('60');
  const [taskType, setTaskType] = useState('jira');

  const taskTypes = [
    { id: 'jira', label: 'Jira', color: 'bg-blue-500' },
    { id: 'github', label: 'GitHub', color: 'bg-emerald-500' },
    { id: 'meeting', label: 'Meeting', color: 'bg-purple-500' },
    { id: 'focus', label: 'Focus', color: 'bg-amber-500' },
  ];

  const handleSave = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg ${themeStyles.cardBg} rounded-t-3xl border-t ${themeStyles.border} p-6 pb-10 animate-slide-up`}
      >
        {/* Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-slate-600" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 mt-2">
          <h2 className="text-xl font-bold">New Time Block</h2>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full ${themeStyles.inputBg} flex items-center justify-center ${themeStyles.textMuted}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Task Title */}
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-2 ${themeStyles.textMuted}`}>
            What are you working on?
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Review pull requests"
            className={`w-full px-4 py-3 rounded-xl ${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            autoFocus
          />
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${themeStyles.textMuted}`}>
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl ${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${themeStyles.textMuted}`}>
              Duration
            </label>
            <select
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl ${themeStyles.inputBg} border ${themeStyles.border} ${themeStyles.text} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            >
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>

        {/* Task Type */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${themeStyles.textMuted}`}>
            Category
          </label>
          <div className="flex gap-2">
            {taskTypes.map(type => (
              <button
                key={type.id}
                onClick={() => setTaskType(type.id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  taskType === type.id
                    ? `${type.color} text-white shadow-lg`
                    : `${themeStyles.inputBg} ${themeStyles.textMuted}`
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 py-3.5 rounded-xl border ${themeStyles.border} font-medium ${themeStyles.textMuted}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/25 transition-all"
          >
            Add Block
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
};

// ============================================
// TASK DETAIL MODAL
// ============================================
const TaskDetailModal = ({ task, themeStyles, isDark, onClose }) => {
  const typeColors = {
    github: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', solid: 'bg-emerald-500' },
    jira: { bg: 'bg-blue-500/15', text: 'text-blue-400', solid: 'bg-blue-500' },
    meeting: { bg: 'bg-purple-500/15', text: 'text-purple-400', solid: 'bg-purple-500' },
  };

  const config = typeColors[task.type] || typeColors.jira;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md ${themeStyles.cardBg} rounded-3xl border ${themeStyles.border} overflow-hidden animate-scale-in`}
      >
        {/* Header with color */}
        <div className={`${config.solid} p-6 pb-8`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="inline-block px-2 py-1 rounded-lg bg-white/20 text-white text-xs font-medium mb-3">
            {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
          </span>
          <h2 className="text-xl font-bold text-white">{task.title}</h2>
          <p className="text-white/70 text-sm mt-1">{task.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Time info */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`flex-1 p-4 rounded-2xl ${themeStyles.inputBg}`}>
              <p className={`text-xs ${themeStyles.textMuted} mb-1`}>Start Time</p>
              <p className="text-lg font-semibold font-mono">{task.time}</p>
            </div>
            <div className={`flex-1 p-4 rounded-2xl ${themeStyles.inputBg}`}>
              <p className={`text-xs ${themeStyles.textMuted} mb-1`}>End Time</p>
              <p className="text-lg font-semibold font-mono">{task.endTime}</p>
            </div>
          </div>

          {/* Status */}
          <div className={`p-4 rounded-2xl ${themeStyles.inputBg} mb-6`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs ${themeStyles.textMuted} mb-1`}>Status</p>
                <p className="font-semibold">
                  {task.completed ? '✓ Completed' : task.isNow ? '● In Progress' : '○ Scheduled'}
                </p>
              </div>
              {task.progress !== undefined && (
                <div className="text-right">
                  <p className={`text-xs ${themeStyles.textMuted} mb-1`}>Progress</p>
                  <p className="font-semibold">{task.progress}%</p>
                </div>
              )}
            </div>
            {task.progress !== undefined && (
              <div
                className={`mt-3 h-2 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'} overflow-hidden`}
              >
                <div
                  className={`h-full rounded-full ${config.solid}`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!task.completed && (
              <>
                <button
                  className={`flex-1 py-3 rounded-xl ${themeStyles.inputBg} font-medium ${themeStyles.textMuted} flex items-center justify-center gap-2`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                    />
                  </svg>
                  Edit
                </button>
                <button className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Complete
                </button>
              </>
            )}
            {task.completed && (
              <button
                className={`w-full py-3 rounded-xl ${themeStyles.inputBg} font-medium ${themeStyles.textMuted}`}
              >
                Reopen Task
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

// ============================================
// LOADING SCREEN
// ============================================
const LoadingScreen = ({ themeStyles, isDark }) => (
  <div
    className={`fixed inset-0 z-[100] ${themeStyles.bg} flex flex-col items-center justify-center`}
  >
    <style>{`
      @keyframes pulse-logo { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.05); opacity: 0.8; } }
      @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      .pulse-logo { animation: pulse-logo 2s ease-in-out infinite; }
    `}</style>

    {/* Logo */}
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 pulse-logo mb-8">
      <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
        <rect x="14" y="6" width="20" height="8" rx="2" fill="white" fillOpacity="0.4" />
        <rect x="14" y="16" width="20" height="8" rx="2" fill="white" fillOpacity="0.6" />
        <rect x="14" y="26" width="20" height="8" rx="2" fill="white" fillOpacity="0.8" />
        <rect x="14" y="36" width="20" height="8" rx="2" fill="white" />
        <path
          d="M10 10v28"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
        <circle cx="10" cy="30" r="2" fill="white" />
      </svg>
    </div>

    {/* Loading bar */}
    <div
      className={`w-32 h-1 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'} overflow-hidden`}
    >
      <div className="h-full w-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" />
    </div>

    <p className={`mt-4 text-sm ${themeStyles.textMuted}`}>Loading your day...</p>
  </div>
);

// ============================================
// EMPTY STATES
// ============================================
const EmptyState = ({ icon, title, description, action, actionLabel, themeStyles, isDark }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    <div
      className={`w-16 h-16 rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center mb-4 ${themeStyles.textMuted}`}
    >
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-1">{title}</h3>
    <p className={`text-sm ${themeStyles.textMuted} max-w-xs mb-6`}>{description}</p>
    {action && (
      <button
        onClick={action}
        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

const EmptyTasks = ({ onAdd, themeStyles, isDark }) => (
  <EmptyState
    icon={
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        />
      </svg>
    }
    title="No time blocks yet"
    description="Plan your day by adding time blocks for your tasks and meetings."
    action={onAdd}
    actionLabel="Add First Block"
    themeStyles={themeStyles}
    isDark={isDark}
  />
);

const EmptyInbox = ({ themeStyles, isDark }) => (
  <EmptyState
    icon={
      <svg
        className="w-8 h-8"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
        />
      </svg>
    }
    title="Inbox zero!"
    description="All caught up. New tasks from your integrations will appear here."
    themeStyles={themeStyles}
    isDark={isDark}
  />
);

// ============================================
// SKELETON LOADERS
// ============================================
const SkeletonCard = ({ themeStyles, isDark }) => (
  <div
    className={`${themeStyles.cardBg} rounded-2xl border ${themeStyles.border} p-4 animate-pulse`}
  >
    <div className="flex items-start gap-3">
      <div className={`w-12 h-8 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
      <div className="flex-1">
        <div className={`h-4 w-16 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'} mb-2`} />
        <div className={`h-5 w-3/4 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'} mb-1`} />
        <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
      </div>
      <div className={`w-6 h-6 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
    </div>
  </div>
);

const TaskListSkeleton = ({ themeStyles, isDark }) => (
  <div className="space-y-3 px-5">
    <SkeletonCard themeStyles={themeStyles} isDark={isDark} />
    <SkeletonCard themeStyles={themeStyles} isDark={isDark} />
    <SkeletonCard themeStyles={themeStyles} isDark={isDark} />
    <SkeletonCard themeStyles={themeStyles} isDark={isDark} />
  </div>
);

export default TymblokApp;
