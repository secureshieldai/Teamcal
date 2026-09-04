module.exports = ({ config }) => ({
  ...config,
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
