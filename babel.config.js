module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // CRITICAL: react-native-reanimated plugin MUST be last
      // Required by expo-router - must be properly configured
      "react-native-reanimated/plugin",
    ],
  };
};
