module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    // react-native-worklets/plugin powers react-native-reanimated (required by
    // NativeWind on native). Must be the LAST plugin in the list.
    plugins: ["react-native-worklets/plugin"],
  };
};
