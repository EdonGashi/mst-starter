const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const WriteFilePlugin = require('write-file-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')

const res = p => path.resolve(__dirname, p)

const nodeModules = res('../node_modules')
const entry = res('../server/configure.js')
const output = res('../build-server')

// if you're specifying externals to leave unbundled, you need to tell Webpack
// to still bundle `react-universal-component`, `webpack-flush-chunks` and
// `require-universal-module` so that they know they are running
// within Webpack and can properly make connections to client modules:
const externals = fs
  .readdirSync(nodeModules)
  .filter(x => !/\.bin|react-universal-component|webpack-flush-chunks/.test(x))
  .reduce((externals, mod) => {
    externals[mod] = `commonjs ${mod}`
    return externals
  }, {})

externals['react-dom/server'] = 'commonjs react-dom/server'

module.exports = {
  name: 'server',
  target: 'node',
  node: {
    __dirname: false,
    __filename: false
  },
  // devtool: 'source-map',
  devtool: 'eval',
  entry: [entry],
  externals,
  output: {
    path: output,
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            forceEnv: 'node'
          }
        }
      },
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader'
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
    extensions: ['.tsx', '.ts', '.js', '.scss', '.css']
  },
  plugins: [
    new CaseSensitivePathsPlugin(),
    new WriteFilePlugin(),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
        RENDER: JSON.stringify('both'),
        IS_SERVER: JSON.stringify(true),
        IS_CLIENT: JSON.stringify(false)
      }
    })
  ]
}
