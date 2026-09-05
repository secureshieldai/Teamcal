module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    minSdkVersion: 26,
  },
  plugins: [
    ...(config.plugins || []),
    'expo-asset',
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
        },
      },
    ],
  ],
});
