const path = require('path')
const webpack = require('webpack')
const WriteFilePlugin = require('write-file-webpack-plugin') // here so you can see what chunks are built
const ExtractCssChunks = require('extract-css-chunks-webpack-plugin')
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin')

module.exports = {
  name: 'client',
  target: 'web',
  // devtool: 'source-map',
  devtool: 'eval',
  entry: [
    'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=false&quiet=false&noInfo=false',
    path.resolve(__dirname, '../src/index.js')
  ],
  output: {
    filename: '[name].js',
    chunkFilename: '[name].js',
    path: path.resolve(__dirname, '../buildClient'),
    publicPath: '/static/'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            forceEnv: 'browser'
          }
        }
      },
      {
        test: /\.s?css$/,
        use: ExtractCssChunks.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                modules: false,
                localIdentName: '[name]__[local]--[hash:base64:5]'
              }
            },
            {
              loader: 'sass-loader'
            }
          ]
        })
      }
    ]
  },
  resolve: {
    modules: ['node_modules', '../modules', '../src'],
    extensions: ['.client.js', '.js', '.scss', '.css']
  },
  plugins: [
    new CaseSensitivePathsPlugin(),
    new WriteFilePlugin(),
    new ExtractCssChunks(),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: function (module) {
        if (module.resource && (/^.*\.(css|scss)$/).test(module.resource)) {
          return false
        }

        return module.context && module.context.indexOf('node_modules') !== -1
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({
      names: ['bootstrap'], // needed to put webpack bootstrap code before chunks
      filename: '[name].js',
      minChunks: Infinity
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
        IS_SERVER: JSON.stringify(false),
        IS_CLIENT: JSON.stringify(true)
      }
    })
  ]
}
