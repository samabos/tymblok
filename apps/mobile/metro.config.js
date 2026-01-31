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

// Resolve source files for workspace packages
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle workspace packages - resolve to source
  if (moduleName.startsWith('@tymblok/')) {
    const packageName = moduleName.replace('@tymblok/', '');
    const sourcePath = path.resolve(monorepoRoot, 'packages', packageName, 'src', 'index.ts');
    if (require('fs').existsSync(sourcePath)) {
      return { filePath: sourcePath, type: 'sourceFile' };
    }
  }
  // Fall back to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
