const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, {
  input: path.join(projectRoot, 'global.css'),
  projectRoot,
  configPath: path.join(projectRoot, 'tailwind.config.js'),
  outputDir: path.join(projectRoot, 'node_modules', '.cache', 'nativewind'),
  inlineRem: false,
});
