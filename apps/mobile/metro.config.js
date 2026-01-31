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

// Force axios to use browser build (avoid Node.js crypto dependency)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'axios' || moduleName.startsWith('axios/')) {
    // Redirect Node.js axios build to browser build
    if (moduleName.includes('/node/')) {
      const browserPath = moduleName.replace('/node/', '/browser/');
      return context.resolveRequest(context, browserPath, platform);
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
