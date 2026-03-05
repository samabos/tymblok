/**
 * Local APK build script for Windows + pnpm monorepo.
 *
 * Handles the Metro project root issue by using absolute paths,
 * and skips Gradle's auto-bundling (which breaks in pnpm monorepos).
 *
 * Usage: node scripts/build-apk.js
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ANDROID = path.join(ROOT, 'android');
const ASSETS = path.join(ANDROID, 'app', 'src', 'main', 'assets');
const BUNDLE = path.join(ASSETS, 'index.android.bundle');
const BUILD_GRADLE = path.join(ANDROID, 'app', 'build.gradle');
const ENTRY = path.join(ROOT, 'index.js');
const APK_OUT = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
}

function step(msg) {
  console.log(`\n${'='.repeat(60)}\n  ${msg}\n${'='.repeat(60)}`);
}

// 1. Prebuild
step('Step 1/5: Expo prebuild');
try {
  // Stop Gradle daemon first to avoid EBUSY lock
  if (fs.existsSync(path.join(ANDROID, 'gradlew.bat'))) {
    try { execSync('gradlew.bat --stop', { cwd: ANDROID, stdio: 'ignore' }); } catch {}
  }
} catch {}
run('npx expo prebuild --clean --platform android');

// 2. Patch build.gradle — skip Gradle's JS bundling
step('Step 2/5: Patch build.gradle');
let gradle = fs.readFileSync(BUILD_GRADLE, 'utf8');
if (!gradle.includes('debuggableVariants')) {
  gradle = gradle.replace(
    /^(react \{)/m,
    '$1\n    debuggableVariants = ["debug", "release"]'
  );
  fs.writeFileSync(BUILD_GRADLE, gradle, 'utf8');
  console.log('  Patched: debuggableVariants set to skip auto-bundling');
} else {
  console.log('  Already patched, skipping');
}

// 3. Bundle JS with Metro (absolute path workaround for monorepo)
step('Step 3/5: Bundle JS with Metro');
fs.mkdirSync(ASSETS, { recursive: true });
const bundleTemp = BUNDLE + '.js'; // Metro appends .js
if (fs.existsSync(bundleTemp)) fs.unlinkSync(bundleTemp);
if (fs.existsSync(BUNDLE)) fs.unlinkSync(BUNDLE);

run(`npx metro build "${ENTRY}" --platform android --dev false --out "${BUNDLE}"`);

// Metro appends .js — rename it
if (fs.existsSync(bundleTemp) && !fs.existsSync(BUNDLE)) {
  fs.renameSync(bundleTemp, BUNDLE);
  console.log('  Renamed .bundle.js -> .bundle');
}

if (!fs.existsSync(BUNDLE)) {
  console.error('  ERROR: Bundle file not found at', BUNDLE);
  process.exit(1);
}
console.log(`  Bundle size: ${(fs.statSync(BUNDLE).size / 1024 / 1024).toFixed(1)} MB`);

// 4. Gradle release build (native only, JS already bundled)
step('Step 4/5: Gradle assembleRelease');
run('gradlew.bat assembleRelease', { cwd: ANDROID });

// 5. Done
step('Step 5/5: Done!');
if (fs.existsSync(APK_OUT)) {
  const size = (fs.statSync(APK_OUT).size / 1024 / 1024).toFixed(1);
  console.log(`  APK: ${APK_OUT}`);
  console.log(`  Size: ${size} MB`);
} else {
  console.log('  APK location: android/app/build/outputs/apk/release/');
}
