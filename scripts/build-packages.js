/**
 * Builds workspace packages that the mobile app depends on.
 * Used by EAS Build (prebuildCommand) since dist/ is gitignored.
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const packages = ['theme', 'shared', 'api-client'];

for (const pkg of packages) {
  const dir = path.join(root, 'packages', pkg);
  console.log(`\nBuilding @tymblok/${pkg}...`);
  execSync('pnpm build', { cwd: dir, stdio: 'inherit' });
  console.log(`Done: @tymblok/${pkg}`);
}
