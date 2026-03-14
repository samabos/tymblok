import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');
const brandDir = resolve(__dirname, '../../../docs/brand');
mkdirSync(publicDir, { recursive: true });

// OG Image (1200x630) - clean, product-focused
const ogImageSvg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
    <linearGradient id="glow1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0.04"/>
    </linearGradient>
    <linearGradient id="glow2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0.02"/>
    </linearGradient>
    <linearGradient id="timeline" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#a855f7"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Ambient glow -->
  <ellipse cx="350" cy="315" rx="350" ry="280" fill="url(#glow1)"/>
  <ellipse cx="900" cy="350" rx="280" ry="200" fill="url(#glow2)"/>

  <!-- Logo: Block tower icon (from brand) -->
  <g transform="translate(80, 70)">
    <rect x="0" y="0" width="3" height="50" rx="1.5" fill="url(#timeline)"/>
    <rect x="8" y="0" width="24" height="9" rx="2.5" fill="#6366f1"/>
    <rect x="8" y="13" width="33" height="9" rx="2.5" fill="#818cf8"/>
    <rect x="8" y="26" width="44" height="9" rx="2.5" fill="#a855f7"/>
    <rect x="8" y="39" width="44" height="8" rx="2.5" fill="#6366f1"/>
  </g>

  <!-- Wordmark -->
  <text x="148" y="107" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="white">Tym<tspan fill="#818cf8">blok</tspan></text>

  <!-- Headline -->
  <text x="80" y="230" font-family="system-ui, -apple-system, sans-serif" font-size="54" font-weight="700" fill="white">Plan your dev day</text>
  <text x="80" y="295" font-family="system-ui, -apple-system, sans-serif" font-size="54" font-weight="700" fill="white">with <tspan fill="url(#brand)">visual time blocks</tspan></text>

  <!-- Subheadline -->
  <text x="80" y="355" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#94a3b8">The productivity app that understands PRs, tickets,</text>
  <text x="80" y="385" font-family="system-ui, -apple-system, sans-serif" font-size="22" fill="#94a3b8">deep work sessions, and developer workflows.</text>

  <!-- Visual: Mobile-style TaskCard preview (right side) -->
  <g transform="translate(700, 80)">
    <!-- Phone frame -->
    <rect x="0" y="0" width="420" height="470" rx="24" fill="#0f172a" stroke="#1e293b" stroke-width="1.5"/>

    <!-- Header: day + date + stats (like TodayScreen) -->
    <text x="28" y="40" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="#64748b" letter-spacing="0.5">FRIDAY</text>
    <text x="28" y="72" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="white">Mar 14</text>
    <text x="28" y="92" font-family="system-ui, sans-serif" font-size="13" fill="#64748b">5 blocks · 6.5h planned</text>

    <!-- Divider -->
    <rect x="28" y="106" width="364" height="1" fill="#1e293b"/>

    <!-- TaskCard 1: Stand-up (purple accent) -->
    <g transform="translate(28, 120)">
      <rect x="0" y="0" width="364" height="56" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="56" rx="2" fill="#a855f7"/>
      <text x="16" y="22" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" fill="#64748b">9:00 AM</text>
      <text x="16" y="42" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="white">Stand-up</text>
      <circle cx="330" cy="22" r="4" fill="#a855f7"/>
      <text x="340" y="26" font-family="system-ui, sans-serif" font-size="11" fill="#a855f7">Meeting</text>
      <text x="340" y="44" font-family="JetBrains Mono, monospace" font-size="11" fill="#475569">15m</text>
    </g>

    <!-- TaskCard 2: Review PR (green accent, "now" highlight) -->
    <g transform="translate(28, 186)">
      <rect x="0" y="0" width="364" height="56" rx="12" fill="rgba(99,102,241,0.08)" stroke="#6366f1" stroke-opacity="0.3" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="56" rx="2" fill="#10b981"/>
      <text x="16" y="22" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" fill="#6366f1">9:30 AM</text>
      <text x="90" y="22" font-family="system-ui, sans-serif" font-size="10" font-weight="600" fill="#6366f1">NOW</text>
      <text x="16" y="42" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="white">Review PR #247</text>
      <circle cx="330" cy="22" r="4" fill="#10b981"/>
      <text x="340" y="26" font-family="system-ui, sans-serif" font-size="11" fill="#10b981">Code</text>
      <text x="340" y="44" font-family="JetBrains Mono, monospace" font-size="11" fill="#475569">30m</text>
    </g>

    <!-- TaskCard 3: Deep work (indigo accent, taller) -->
    <g transform="translate(28, 252)">
      <rect x="0" y="0" width="364" height="72" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="72" rx="2" fill="#6366f1"/>
      <text x="16" y="22" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" fill="#64748b">10:00 AM</text>
      <text x="16" y="42" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="white">Deep work - Auth refactor</text>
      <text x="16" y="60" font-family="system-ui, sans-serif" font-size="12" fill="#475569">Focus mode · No notifications</text>
      <circle cx="330" cy="22" r="4" fill="#6366f1"/>
      <text x="340" y="26" font-family="system-ui, sans-serif" font-size="11" fill="#6366f1">Dev</text>
      <text x="340" y="44" font-family="JetBrains Mono, monospace" font-size="11" fill="#475569">2h</text>
    </g>

    <!-- TaskCard 4: Lunch (muted) -->
    <g transform="translate(28, 334)">
      <rect x="0" y="0" width="364" height="50" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="50" rx="2" fill="#475569"/>
      <text x="16" y="20" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" fill="#64748b">12:00 PM</text>
      <text x="16" y="40" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="#94a3b8">Lunch</text>
      <text x="340" y="40" font-family="JetBrains Mono, monospace" font-size="11" fill="#475569">1h</text>
    </g>

    <!-- TaskCard 5: JIRA ticket (blue accent) -->
    <g transform="translate(28, 394)">
      <rect x="0" y="0" width="364" height="56" rx="12" fill="#0f172a" stroke="#1e293b" stroke-width="1"/>
      <rect x="0" y="0" width="4" height="56" rx="2" fill="#3b82f6"/>
      <text x="16" y="22" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" fill="#64748b">1:00 PM</text>
      <text x="16" y="42" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="white">JIRA-1042 - API tests</text>
      <circle cx="330" cy="22" r="4" fill="#3b82f6"/>
      <text x="340" y="26" font-family="system-ui, sans-serif" font-size="11" fill="#3b82f6">Ticket</text>
      <text x="340" y="44" font-family="JetBrains Mono, monospace" font-size="11" fill="#475569">1.5h</text>
    </g>
  </g>

  <!-- CTA pill -->
  <rect x="80" y="430" width="200" height="48" rx="24" fill="url(#brand)"/>
  <text x="180" y="460" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="white" text-anchor="middle">Join the Waitlist</text>

  <!-- Bottom bar -->
  <rect x="0" y="590" width="1200" height="40" fill="#0f172a" fill-opacity="0.8"/>
  <text x="80" y="616" font-family="system-ui, sans-serif" font-size="16" fill="#475569">tymblok.com</text>
</svg>`;

// Favicon (32x32) - using brand block tower
const faviconSvg = `
<svg width="32" height="32" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-gradient" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#6366f1"/>
      <stop offset="1" stop-color="#a855f7"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg-gradient)"/>
  <g transform="translate(136, 116)">
    <rect x="0" y="0" width="8" height="280" rx="4" fill="white" fill-opacity="0.9"/>
    <rect x="20" y="0" width="100" height="52" rx="12" fill="white"/>
    <rect x="20" y="68" width="150" height="52" rx="12" fill="white" fill-opacity="0.9"/>
    <rect x="20" y="136" width="200" height="52" rx="12" fill="white" fill-opacity="0.8"/>
    <rect x="20" y="204" width="220" height="52" rx="12" fill="white" fill-opacity="0.7"/>
  </g>
</svg>`;

async function generate() {
  // OG Image
  await sharp(Buffer.from(ogImageSvg))
    .png()
    .toFile(resolve(publicDir, 'og-image.png'));
  console.log('Created public/og-image.png (1200x630)');

  // Apple Touch Icon - use the actual brand app icon
  await sharp(resolve(brandDir, 'app-icon.svg'))
    .resize(180, 180)
    .png()
    .toFile(resolve(publicDir, 'apple-touch-icon.png'));
  console.log('Created public/apple-touch-icon.png (180x180)');

  // Favicon SVG - use the brand block tower
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toFile(resolve(publicDir, 'favicon.png'));
  console.log('Created public/favicon.png (32x32)');

  // Also write the SVG favicon
  const { writeFileSync } = await import('fs');
  writeFileSync(resolve(publicDir, 'favicon.svg'), faviconSvg.trim());
  console.log('Created public/favicon.svg');
}

generate().catch(console.error);
