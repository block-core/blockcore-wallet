import type { Configuration } from 'webpack';
const ExtensionReloader = require('webpack-ext-reloader');
const config = require('./webpack.config');

module.exports = {
  ...config,
  mode: 'development',
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
  plugins: [
    new ExtensionReloader({
      reloadPage: true, // Force the reload of the page also
      entries: { // The entries used for the content/background scripts or extension pages
        background: 'background',
        provider: 'provider',
      }
    })
  ]
} as Configuration;