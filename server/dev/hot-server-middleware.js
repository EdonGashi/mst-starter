const webpackHotServerMiddleware = require('webpack-hot-server-middleware')

const createKoaHandler = (error, serverRenderer) => (ctx, next) => {
  if (error) {
    ctx.throw(error)
  }

  return serverRenderer(ctx, next)
}

module.exports = function hotServerMiddleware(compiler) {
  return webpackHotServerMiddleware(compiler, {
    createHandler: createKoaHandler,
    serverRendererOptions: {}
  })
}
