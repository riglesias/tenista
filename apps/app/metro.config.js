const {
  withNativeWind: withNativeWind
} = require("nativewind/metro");

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const monorepoRoot = path.resolve(__dirname, '../..');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Monorepo support: watch the root and resolve modules from both locations
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

const nodeCoreModules = [
  'stream',
  'events',
  'crypto',
  'http',
  'https',
  'url',
  'net',
  'tls',
  'fs', // Explicitly mock fs as it's definitely not available
  'path',
  'zlib', 
  'vm', 
  'tty'
];

const shims = {
  stream: require.resolve('stream-browserify'),
  events: require.resolve('events/'),
  crypto: require.resolve('react-native-get-random-values'),
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  url: require.resolve('url/'),
  net: require.resolve('react-native-tcp-socket'),
  path: require.resolve('path-browserify'),
  // For modules we want to mock (make empty or non-functional but present)
  tls: false, // Setting to false tells Metro to provide a basic mock
  fs: false,
  zlib: false, // Example: if zlib is not strictly needed for client operations
  vm: false,
  tty: false,
  // Crucially, mock 'ws' itself if it's the source of deep Node.js dependencies
  // that are hard to shim completely for Expo Go.
  ws: false, 
};

config.resolver = {
  ...config.resolver,
  extraNodeModules: new Proxy(
    { ...shims }, // Start with our shims
    {
      get: (target, name) => {
        if (target.hasOwnProperty(name)) {
          return target[name];
        }
        // For any other Node core module not explicitly shimmed/mocked, 
        // return a basic mock to prevent resolution errors.
        if (nodeCoreModules.includes(name) && typeof name === 'string') {
          // console.log(`Metro: Providing basic mock for Node core module: ${name}`);
          return false; // false tells Metro to use an empty mock
        }
        // Fallback to default behavior for non-Node core modules
        return undefined;
      },
    }
  ),
  // For more fine-grained control if extraNodeModules isn't sufficient
  resolveRequest: (context, moduleName, platform) => {
    if (shims.hasOwnProperty(moduleName)) {
      const filePath = shims[moduleName];
      if (filePath === false) {
        // console.log(`Metro: resolveRequest mocking module: ${moduleName}`);
        return { type: 'empty' }; // Use Metro's empty module mock
      }
      // console.log(`Metro: resolveRequest shimming ${moduleName} with ${filePath}`);
      return {
        filePath: filePath,
        type: 'sourceFile',
      };
    }
    // Fallback to the default resolver for other modules
    return context.resolveRequest(context, moduleName, platform);
  },
};

// If you have a 'transformer' configuration, ensure it's preserved
// config.transformer = {
//   ...config.transformer,
//   // your transformer config
// };

// If you have a 'server' configuration, ensure it's preserved
// config.server = {
//   ...config.server,
//   // your server config
// };

module.exports = withNativeWind(config, {
  input: "./global.css"
});