const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Require nativewind from root node_modules (monorepo hoisting)
const { withNativeWind } = require(path.join(monorepoRoot, 'node_modules', 'nativewind', 'metro'));

// Use async config to ensure proper initialization order
async function createConfig() {
  const config = getDefaultConfig(projectRoot);

  config.watchFolders = [monorepoRoot];
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
  ];
  config.resolver.disableHierarchicalLookup = true;

  return withNativeWind(config, {
    input: './global.css',
    outputDir: './.cache/nativewind',
  });
}

module.exports = createConfig();
