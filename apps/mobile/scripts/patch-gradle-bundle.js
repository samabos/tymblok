/**
 * Patches the generated android/app/build.gradle for monorepo local builds.
 * Skips Gradle's auto-bundling (which fails in pnpm monorepos) so we can
 * bundle JS manually from the correct project root instead.
 * Run after `npx expo prebuild` and before the manual bundle + gradle build.
 */
const fs = require('fs');
const path = require('path');

const buildGradle = path.join(__dirname, '..', 'android', 'app', 'build.gradle');

if (!fs.existsSync(buildGradle)) {
  console.error('build.gradle not found — run expo prebuild first');
  process.exit(1);
}

let content = fs.readFileSync(buildGradle, 'utf8');

if (content.includes('debuggableVariants')) {
  console.log('[patch] debuggableVariants already set, skipping');
  process.exit(0);
}

// Mark all variants as debuggable so Gradle skips its own JS bundling.
// We bundle JS manually instead (Gradle's bundler fails in pnpm monorepos).
content = content.replace(
  /^(react \{)/m,
  '$1\n    debuggableVariants = ["debug", "release"]'
);

fs.writeFileSync(buildGradle, content, 'utf8');
console.log('[patch] Set debuggableVariants to skip Gradle bundling');

// Ensure the assets directory exists for the manual bundle
const assetsDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });
console.log('[patch] Ensured assets directory exists');
