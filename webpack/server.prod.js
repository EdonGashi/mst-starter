const path = require('path')
const webpack = require('webpack')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')
const nodeExternals = require('webpack-node-externals')

const res = p => path.resolve(__dirname, p)

const entry = res('../server/configure.js')
const output = res('../buildServer')

module.exports = {
  name: 'server',
  target: 'node',
  node: {
    __dirname: false,
    __filename: false
  },
  externals: [nodeExternals()],
  devtool: 'source-map',
  entry: [entry],
  output: {
    path: output,
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            forceEnv: 'node'
          }
        }
      },
      {
        test: /\.s?css$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'css-loader/locals',
            options: {
              modules: false,
              localIdentName: '[name]__[local]--[hash:base64:5]'
            }
          },
          {
            loader: 'sass-loader'
          }
        ]
      }
    ]
  },
  resolve: {
    modules: ['node_modules', '../modules', '../src'],
    extensions: ['.server.js', '.js', '.scss', '.css']
  },
  plugins: [
    new CaseSensitivePathsPlugin(),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
        CLIENT_ROOT: JSON.stringify(res('../buildClient')),
        SERVER_ROOT: JSON.stringify(res('../buildServer')),
        IS_SERVER: JSON.stringify(true),
        IS_CLIENT: JSON.stringify(false)
      }
    })
  ]
}
