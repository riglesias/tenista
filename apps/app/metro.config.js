const {
  withNativeWind: withNativeWind
} = require("nativewind/metro");

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const monorepoRoot = path.resolve(__dirname, '../..');
const appNodeModules = path.resolve(__dirname, 'node_modules');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Monorepo support: watch the root and resolve modules from both locations
config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  appNodeModules,
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
  'fs',
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
  tls: false,
  fs: false,
  zlib: false,
  vm: false,
  tty: false,
  ws: false,
};

config.resolver.extraNodeModules = new Proxy(
  { ...shims },
  {
    get: (target, name) => {
      if (target.hasOwnProperty(name)) {
        return target[name];
      }
      if (nodeCoreModules.includes(name) && typeof name === 'string') {
        return false;
      }
      return undefined;
    },
  }
);

// Apply NativeWind FIRST so it can set up its transformer/resolver
const nativeWindConfig = withNativeWind(config, {
  input: "./global.css"
});

// Singleton packages: force React to always resolve from the app's node_modules
// to prevent duplicate copies (monorepo root may have a different React version)
const singletonPackages = ['react', 'react-dom', 'react-native'];

// Resolve the exact entry file for each singleton package at config time
const singletonResolutions = {};
for (const pkg of singletonPackages) {
  try {
    singletonResolutions[pkg] = require.resolve(pkg, { paths: [appNodeModules] });
  } catch {}
}

// Chain our resolver ON TOP of whatever NativeWind set up
const nativeWindResolver = nativeWindConfig.resolver.resolveRequest;

nativeWindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  // 1. Singleton React packages — return exact file path
  if (singletonResolutions[moduleName]) {
    return {
      filePath: singletonResolutions[moduleName],
      type: 'sourceFile',
    };
  }

  // 2. Subpath imports of singleton packages (e.g. react/jsx-runtime)
  const singletonPkg = singletonPackages.find(
    pkg => moduleName.startsWith(pkg + '/')
  );
  if (singletonPkg) {
    try {
      const resolved = require.resolve(moduleName, { paths: [appNodeModules] });
      return {
        filePath: resolved,
        type: 'sourceFile',
      };
    } catch {
      // Fall through to default resolver if subpath doesn't exist
    }
  }

  // 3. Node core module shims
  if (shims.hasOwnProperty(moduleName)) {
    const filePath = shims[moduleName];
    if (filePath === false) {
      return { type: 'empty' };
    }
    return {
      filePath: filePath,
      type: 'sourceFile',
    };
  }

  // 4. Chain to NativeWind's resolver, or default
  if (nativeWindResolver) {
    return nativeWindResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = nativeWindConfig;
