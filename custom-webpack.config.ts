import type { Configuration } from 'webpack';
// const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
// const webpack = require('webpack');

module.exports = {
  // plugins: [
  //   new webpack.ProvidePlugin({
  //     Buffer: ['buffer', 'Buffer'],
  //     process: 'process/browser'
  //   })
  // ],
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
      // "buffer": require.resolve('buffer'),
      "stream": require.resolve('stream-browserify'),
      "crypto": require.resolve('crypto-browserify'),
      // "crypto-browserify": require.resolve('crypto-browserify'), //if you want to use this module also don't forget npm i crypto-browserify 
    }
  },
  entry: {
    background: 'src/background.ts',
    // provider: 'src/provider.ts'
  },
} as Configuration;