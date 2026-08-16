const baseConfig = require('./app.json');

module.exports = () => ({
  ...baseConfig.expo,
  android: {
    ...baseConfig.expo.android,
    // EAS file secrets resolve to a temporary path on the remote builder.
    // Keep the local file as the fallback for development builds.
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON || baseConfig.expo.android.googleServicesFile,
  },
});
