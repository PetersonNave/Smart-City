const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Compila o global.css (Tailwind) para o NativeWind.
module.exports = withNativeWind(config, { input: './global.css' });
