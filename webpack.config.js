const path = require('path')
const webpack = require('webpack')

const env = process.env.NODE_ENV || 'development'

module.exports = {
  mode: env,
  // 'babel-polyfill' is required for generators
  entry: ['babel-polyfill',
          './ui/admin/app',
          // also, import all the app components
          './ui/admin/models',
          './ui/admin/access_tokens/controllers',
          './ui/admin/administrators/controllers',
          './ui/admin/aws_accounts/controllers',
          './ui/admin/experiments/controllers',
          './ui/admin/experiments/blocks/controllers',
          './ui/admin/mturk/controllers',
          './ui/admin/responses/controllers',
          './ui/admin/templates/controllers'],
  output: {
    path: path.resolve(__dirname, 'ui', 'build'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
            // ng-annotate is deprecated and points to its successor:
            // babel-plugin-angularjs-annotate
            plugins: ['angularjs-annotate'],
          },
        },
      },
    ],
  },
}
