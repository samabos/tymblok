const BlockTowerLogo = ({ size = 80, variant = 'color' }: { size?: number; variant?: 'color' | 'white' | 'dark' }) => {
  const colors = variant === 'white'
    ? ['#fff', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.55)']
    : variant === 'dark'
    ? ['#1e293b', '#334155', '#475569', '#1e293b']
    : ['#6366f1', '#818cf8', '#a855f7', '#6366f1'];

  const lineColor = variant === 'white' ? 'rgba(255,255,255,0.9)' : variant === 'dark' ? '#334155' : 'url(#tl-grad)';

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <rect x="12" y="12" width="2" height="56" rx="1" fill={lineColor} />
      <rect x="18" y="12" width="28" height="11" rx="3" fill={colors[0]} />
      <rect x="18" y="27" width="38" height="11" rx="3" fill={colors[1]} />
      <rect x="18" y="42" width="50" height="11" rx="3" fill={colors[2]} />
      <rect x="18" y="57" width="50" height="10" rx="3" fill={colors[3]} />
      {variant === 'color' && (
        <defs>
          <linearGradient id="tl-grad" x1="13" y1="12" x2="13" y2="68" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
};

export default BlockTowerLogo;
