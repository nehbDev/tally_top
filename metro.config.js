const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Ensure Metro can resolve absolute imports by respecting the baseUrl in jsconfig.json
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'jsx', 'js', 'ts', 'tsx'], // Ensure all necessary extensions are included
};

// Optional: Log resolver details for debugging (remove in production)
console.log('Metro Resolver Config:', config.resolver);

module.exports = withNativeWind(config, { input: './global.css' });