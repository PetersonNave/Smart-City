module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind: `className` nos componentes do React Native vira estilo nativo.
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
