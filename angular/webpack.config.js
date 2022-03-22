const { ProvidePlugin, DefinePlugin } = require('webpack');

module.exports = {
  plugins: [new ProvidePlugin({
    Buffer: ['buffer', 'Buffer'],
  }),
  new DefinePlugin({
    VERSION: JSON.stringify(require("../package.json").version)
  })],
  resolve: {
    fallback: {
      "fs": false,
      "tls": false,
      "net": false,
      "path": false,
      // "zlib": require.resolve('browserify-zlib'),
      "zlib": false,
      "http": false,
      "https": false,
      buffer: require.resolve('buffer/'),
      "stream": require.resolve('stream-browserify'),
      "crypto": require.resolve('crypto-browserify'),
      // "crypto-browserify": require.resolve('crypto-browserify'), //if you want to use this module also don't forget npm i crypto-browserify 
    }
  }
};