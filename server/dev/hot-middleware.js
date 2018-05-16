
const webpackHotMiddleware = require('webpack-hot-middleware')
const { PassThrough } = require('stream')

function koaHotware(middleware) {
  return async (context, next) => {
    const stream = new PassThrough()

    await middleware(context.req, {
      write: stream.write.bind(stream),
      writeHead: (status, headers) => {
        context.body = stream
        context.status = status
        context.set(headers)
      }
    }, next)
  }
}

module.exports = function hotMiddleware(compiler) {
  return koaHotware(webpackHotMiddleware(compiler))
}
