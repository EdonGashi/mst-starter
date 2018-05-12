const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const webpackHotServerMiddleware = require('webpack-hot-server-middleware')
const { PassThrough } = require('stream')

/**
 * @method koaDevware
 * @desc   Middleware for Koa to proxy webpack-dev-middleware
 **/
function koaDevware(dev, compiler) {

  /**
   * @method waitMiddleware
   * @desc   Provides blocking for the Webpack processes to complete.
   **/
  function waitMiddleware() {
    return new Promise((resolve, reject) => {
      dev.waitUntilValid(() => {
        resolve(true)
      })

      compiler.plugin('failed', (error) => {
        reject(error)
      })
    })
  }

  return async (context, next) => {
    await waitMiddleware()
    await new Promise((resolve, reject) => {
      dev(context.req, {
        end: (content) => {
          context.body = content
          resolve()
        },
        setHeader: context.set.bind(context),
        locals: context.state
      }, () => resolve(next()))
    })
  }
}

/**
 * @method koaHotware
 * @desc   Middleware for Koa to proxy webpack-hot-middleware
 **/
function koaHotware(hot, compiler) {

  return async (context, next) => {
    const stream = new PassThrough()

    await hot(context.req, {
      write: stream.write.bind(stream),
      writeHead: (status, headers) => {
        context.body = stream
        context.status = status
        context.set(headers)
      }
    }, next)
  }
}

const createKoaHandler = (error, serverRenderer) => (ctx, next) => {
  if (error) {
    ctx.throw(error)
  }

  return serverRenderer(ctx, next)
}

function devMiddleware(compiler, options) {
  return koaDevware(webpackDevMiddleware(compiler, options), compiler)
}

function hotMiddleware(compiler) {
  return koaHotware(webpackHotMiddleware(compiler), compiler)
}

function hotServerMiddleware(compiler) {
  return webpackHotServerMiddleware(compiler, {
    createHandler: createKoaHandler,
    serverRendererOptions: {}
  })
}

module.exports = {
  devMiddleware,
  hotMiddleware,
  hotServerMiddleware
}
