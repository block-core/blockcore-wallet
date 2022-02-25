const { CheckerPlugin } = require('awesome-typescript-loader');
const { join } = require('path');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    provider: join(__dirname, 'src/provider.ts'),
    content: join(__dirname, 'src/content.ts'),
    background: join(__dirname, 'src/background.ts')
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    path: join(__dirname, '../dist/extension'),
    filename: '[name].js'
  },
  plugins: [new CheckerPlugin()],
  resolve: {
    extensions: ['.ts', '.js']
  }
};
