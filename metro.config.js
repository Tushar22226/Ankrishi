// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for TypeScript, web platform, and mjs files
config.resolver.sourceExts = [
  'js', 'jsx', 'ts', 'tsx', 'json', 'mjs',
  'web.js', 'web.jsx', 'web.ts', 'web.tsx'
];

// Add support for SVG
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Add extraNodeModules for Firebase
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@firebase/util': path.resolve(__dirname, 'node_modules/@firebase/util'),
};

module.exports = config;
