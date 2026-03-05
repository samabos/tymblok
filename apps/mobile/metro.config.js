const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Use async config for monorepo + NativeWind compatibility
module.exports = (async () => {
  const config = await getDefaultConfig(projectRoot);

  // Monorepo support — keep Expo defaults and add monorepo root
  config.watchFolders = [...(config.watchFolders || []), monorepoRoot];
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(monorepoRoot, 'node_modules'),
  ];

  return withNativeWind(config, { input: './global.css' });
})();
