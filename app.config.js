const { expo } = require('./app.json');

module.exports = {
  ...expo,
  plugins: [
    ...(expo.plugins || []),
    [
      'expo-build-properties',
      {
        android: {
          minSdkVersion: 26,
        },
      },
    ],
  ],
  android: {
    ...expo.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON || expo.android.googleServicesFile,
  },
};
