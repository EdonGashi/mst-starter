require('colors')
const Koa = require('koa')
const webpack = require('webpack')

const DEV = process.env.NODE_ENV === 'development'
const app = new Koa()

let isBuilt = false
function done() {
  if (!isBuilt) {
    app.listen(3000, function () {
      isBuilt = true
      console.log('BUILD COMPLETE -- Listening @ http://localhost:3000'.magenta)
    })
  }
}

if (DEV) {
  const { devMiddleware, hotMiddleware, hotServerMiddleware } = require('./hot-middlewares')
  const clientConfig = require('../webpack/client.dev')
  const serverConfig = require('../webpack/server.dev')
  const { publicPath, outputPath } = clientConfig.output
  const compiler = webpack([clientConfig, serverConfig])
  const clientCompiler = compiler.compilers[0]
  const options = { publicPath, stats: { colors: true } }

  app.use(devMiddleware(compiler, options))
  app.use(hotMiddleware(clientCompiler))
  app.use(hotServerMiddleware(compiler))

  compiler.plugin('done', done)
} else {
  const serve = require('koa-static')
  const mount = require('koa-mount')
  const clientConfigProd = require('../webpack/client.prod')
  const serverConfigProd = require('../webpack/server.prod')
  const { publicPath, outputPath } = clientConfigProd.output
  webpack([clientConfigProd, serverConfigProd]).run((err, stats) => {
    const clientStats = stats.toJson().children[0]
    const serverRender = require('../buildServer/main.js').default

    app.use(mount(publicPath, serve(outputPath)))
    app.use(serverRender({ clientStats }))

    done()
  })
}
