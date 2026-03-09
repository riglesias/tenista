export default ({ config }) => {
  const isDev = process.env.APP_VARIANT === 'development';
  
  return {
    ...config,
    name: isDev ? 'Tenista Dev' : 'Tenista',
    icon: isDev ? './assets/images/icon-dev.png' : './assets/images/icon.png',
    ios: {
      ...config.ios,
      bundleIdentifier: isDev ? 'com.tenista.app.dev' : config.ios.bundleIdentifier,
    },
    android: {
      ...config.android,
      package: isDev ? 'com.tenista.app.dev' : config.android.package,
    },
    plugins: [
      ...(config.plugins || []),
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: 'com.googleusercontent.apps.251208589749-gctj4up1ce36inf0l7cr99702hc8un3b',
        }
      ]
    ]
  };
};