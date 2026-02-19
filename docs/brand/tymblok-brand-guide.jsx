import React, { useState } from 'react';

// Tymblok Brand Showcase
export default function TymblokBrandGuide() {
  const [darkMode, setDarkMode] = useState(true);
  const [copiedColor, setCopiedColor] = useState(null);

  const copyToClipboard = (hex, name) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(name);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  // SVG Icons (matching tymblok-full.jsx)
  const Icons = {
    github: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    jira: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.005 1.005 0 0 0 23.013 0z" />
      </svg>
    ),
    users: (
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
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
        />
      </svg>
    ),
    bolt: (
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
          d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
        />
      </svg>
    ),
  };

  const colors = {
    primary: [
      { name: 'Indigo 600', hex: '#4f46e5', usage: 'Primary CTA' },
      { name: 'Indigo 500', hex: '#6366f1', usage: 'Hover, accent' },
      { name: 'Indigo 400', hex: '#818cf8', usage: 'Light accent' },
      { name: 'Purple 500', hex: '#a855f7', usage: 'Secondary' },
    ],
    categories: [
      { name: 'GitHub', hex: '#10b981', icon: Icons.github },
      { name: 'Jira', hex: '#3b82f6', icon: Icons.jira },
      { name: 'Meeting', hex: '#a855f7', icon: Icons.users },
      { name: 'Focus', hex: '#f59e0b', icon: Icons.bolt },
    ],
    status: [
      { name: 'Urgent', hex: '#ef4444' },
      { name: 'Live', hex: '#6366f1' },
      { name: 'Done', hex: '#10b981' },
      { name: 'Warning', hex: '#f59e0b' },
    ],
  };

  const bg = darkMode ? '#020617' : '#f8fafc';
  const card = darkMode ? '#0f172a' : '#ffffff';
  const border = darkMode ? '#1e293b' : '#e2e8f0';
  const text = darkMode ? '#ffffff' : '#0f172a';
  const textMuted = darkMode ? '#94a3b8' : '#64748b';

  // Block Tower Logo Component
  const BlockTowerLogo = ({ size = 80, variant = 'color' }) => {
    const colors =
      variant === 'white'
        ? ['#fff', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.55)']
        : ['#6366f1', '#818cf8', '#a855f7', '#6366f1'];

    return (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        {/* Timeline line */}
        <rect
          x="12"
          y="12"
          width="2"
          height="56"
          rx="1"
          fill={variant === 'white' ? 'rgba(255,255,255,0.9)' : 'url(#tl-grad)'}
        />
        {/* Blocks */}
        <rect x="18" y="12" width="28" height="11" rx="3" fill={colors[0]} />
        <rect x="18" y="27" width="38" height="11" rx="3" fill={colors[1]} />
        <rect x="18" y="42" width="50" height="11" rx="3" fill={colors[2]} />
        <rect x="18" y="57" width="50" height="10" rx="3" fill={colors[3]} />
        {variant !== 'white' && (
          <defs>
            <linearGradient
              id="tl-grad"
              x1="13"
              y1="12"
              x2="13"
              y2="68"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        )}
      </svg>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: bg,
        color: text,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        padding: 24,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <BlockTowerLogo size={48} />
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
              Tym<span style={{ color: '#6366f1' }}>blok</span>
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: textMuted }}>Brand Guide</p>
          </div>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: `1px solid ${border}`,
            backgroundColor: card,
            color: text,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      {/* Logo Section */}
      <section
        style={{
          backgroundColor: card,
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${border}`,
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Logo Variations</h2>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {/* Color Logo */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
                padding: 24,
                borderRadius: 12,
                border: `1px solid ${border}`,
              }}
            >
              <BlockTowerLogo size={80} variant="color" />
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 13, color: textMuted }}>Full Color</p>
          </div>

          {/* White Logo on Gradient */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                padding: 24,
                borderRadius: 12,
              }}
            >
              <BlockTowerLogo size={80} variant="white" />
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 13, color: textMuted }}>On Gradient</p>
          </div>

          {/* App Icon */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                padding: 16,
                borderRadius: 20,
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BlockTowerLogo size={56} variant="white" />
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 13, color: textMuted }}>App Icon</p>
          </div>

          {/* Wordmark */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
                padding: '24px 32px',
                borderRadius: 12,
                border: `1px solid ${border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <BlockTowerLogo size={40} variant="color" />
              <span style={{ fontSize: 24, fontWeight: 700 }}>
                Tym<span style={{ color: '#6366f1' }}>blok</span>
              </span>
            </div>
            <p style={{ margin: '12px 0 0', fontSize: 13, color: textMuted }}>Wordmark</p>
          </div>
        </div>
      </section>

      {/* Primary Colors */}
      <section
        style={{
          backgroundColor: card,
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${border}`,
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Primary Colors</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {colors.primary.map(color => (
            <div
              key={color.name}
              onClick={() => copyToClipboard(color.hex, color.name)}
              style={{
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <div
                style={{
                  width: 140,
                  height: 80,
                  backgroundColor: color.hex,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {copiedColor === color.name && (
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>Copied!</span>
                )}
              </div>
              <p style={{ margin: '8px 0 2px', fontSize: 13, fontWeight: 600 }}>{color.name}</p>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: textMuted,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {color.hex}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 11, color: textMuted }}>{color.usage}</p>
            </div>
          ))}
        </div>

        {/* Gradient */}
        <div style={{ marginTop: 24 }}>
          <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Primary Gradient</p>
          <div
            style={{
              height: 48,
              background: 'linear-gradient(90deg, #6366f1 0%, #a855f7 100%)',
              borderRadius: 12,
            }}
          />
        </div>
      </section>

      {/* Category Colors */}
      <section
        style={{
          backgroundColor: card,
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${border}`,
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Category Colors</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {colors.categories.map(cat => (
            <div
              key={cat.name}
              onClick={() => copyToClipboard(cat.hex, cat.name)}
              style={{ cursor: 'pointer' }}
            >
              <div
                style={{
                  width: 100,
                  height: 64,
                  backgroundColor: cat.hex,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                {cat.icon}
              </div>
              <p style={{ margin: '8px 0 2px', fontSize: 13, fontWeight: 600 }}>{cat.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: textMuted, fontFamily: 'monospace' }}>
                {cat.hex}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Status Colors */}
      <section
        style={{
          backgroundColor: card,
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${border}`,
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Status Colors</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {colors.status.map(status => (
            <div
              key={status.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                backgroundColor: `${status.hex}20`,
                borderRadius: 20,
                border: `1px solid ${status.hex}40`,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: status.hex,
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{status.name}</span>
              <span style={{ fontSize: 11, color: textMuted, fontFamily: 'monospace' }}>
                {status.hex}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section
        style={{
          backgroundColor: card,
          borderRadius: 16,
          padding: 24,
          marginBottom: 24,
          border: `1px solid ${border}`,
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Typography</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <span
              style={{
                fontSize: 11,
                color: textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Display / 32px / Bold
            </span>
            <p style={{ margin: '4px 0 0', fontSize: 32, fontWeight: 700 }}>
              Time Blocking Made Simple
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: 11,
                color: textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              H1 / 24px / Bold
            </span>
            <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 700 }}>
              Your Productivity Dashboard
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: 11,
                color: textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              H2 / 20px / Semibold
            </span>
            <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 600 }}>Today's Schedule</p>
          </div>
          <div>
            <span
              style={{
                fontSize: 11,
                color: textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Body / 16px / Regular
            </span>
            <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 400 }}>
              Plan your day with visual time blocks that integrate with your favorite developer
              tools.
            </p>
          </div>
          <div>
            <span
              style={{
                fontSize: 11,
                color: textMuted,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Mono / JetBrains Mono
            </span>
            <p style={{ margin: '4px 0 0', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }}>
              09:00 - 10:30 · 90 min
            </p>
          </div>
        </div>
      </section>

      {/* Sample UI Elements */}
      <section
        style={{
          backgroundColor: card,
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${border}`,
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>UI Elements</h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              style={{
                padding: '12px 24px',
                backgroundColor: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Primary Button
            </button>
            <button
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: text,
                border: `1px solid ${border}`,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Secondary
            </button>
            <button
              style={{
                padding: '12px 24px',
                backgroundColor: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Danger
            </button>
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <span
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                GitHub
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Jira
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#a855f7',
                  color: '#fff',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Meeting
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span
                style={{
                  padding: '4px 12px',
                  backgroundColor: 'rgba(239,68,68,0.15)',
                  color: '#ef4444',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Urgent
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  backgroundColor: 'rgba(99,102,241,0.15)',
                  color: '#6366f1',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    backgroundColor: '#6366f1',
                    borderRadius: '50%',
                    animation: 'pulse 1.5s infinite',
                  }}
                ></span>
                Live
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  backgroundColor: 'rgba(16,185,129,0.15)',
                  color: '#10b981',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Done
              </span>
            </div>
          </div>

          {/* Sample Card */}
          <div
            style={{
              backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
              borderRadius: 12,
              padding: 16,
              border: `1px solid ${border}`,
              width: 280,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8,
              }}
            >
              <span
                style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: textMuted }}
              >
                09:00
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  backgroundColor: '#10b981',
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                GitHub
              </span>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600 }}>Review Pull Requests</p>
            <p style={{ margin: 0, fontSize: 13, color: textMuted }}>Team PR queue · 90 min</p>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
