const path = require('path');
const webpack = require('webpack');

const env = process.env.NODE_ENV || 'development';

module.exports = {
  entry: './build',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, [/moment$/]),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    ...(env === 'production' ? [
      new webpack.optimize.UglifyJsPlugin(),
    ] : [
      new webpack.NoErrorsPlugin(),
    ]),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.less$/,
        loaders: ['style-loader', 'css-loader', 'less-loader'],
      },
    ],
  },
};
