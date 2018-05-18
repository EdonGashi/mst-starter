require('colors')
const webpack = require('webpack')

const DEV = process.env.NODE_ENV === 'development'
global.IS_BUILD = true

if (DEV) {
  const Koa = require('koa')
  const { devMiddleware, hotMiddleware, hotServerMiddleware } = require('./dev')

  const clientConfig = require('../webpack/client.dev')
  const serverConfig = require('../webpack/server.dev')

  const { publicPath } = clientConfig.output
  const compiler = webpack([clientConfig, serverConfig])
  const clientCompiler = compiler.compilers[0]
  const options = { publicPath, stats: { colors: true } }

  const app = new Koa()
  app.use(devMiddleware(compiler, options))
  app.use(hotMiddleware(clientCompiler))
  app.use(hotServerMiddleware(compiler))

  let isBuilt = false
  compiler.plugin('done', function () {
    if (!isBuilt) {
      app.listen(3000, function () {
        isBuilt = true
        console.log('BUILD COMPLETE -- Listening @ http://localhost:3000'.magenta)
      })
    }
  })
} else {
  const fs = require('fs')
  const path = require('path')
  const clientConfigProd = require('../webpack/client.prod')
  const serverConfigProd = require('../webpack/server.prod')

  const { path: serverPath } = serverConfigProd.output
  const { publicPath } = clientConfigProd.output
  webpack([clientConfigProd, serverConfigProd]).run((err, stats) => {
    const clientStats = stats.toJson().children[0]
    fs.writeFileSync(path.join(serverPath, 'stats.json'), JSON.stringify({
      clientStats,
      publicPath
    }))

    fs.writeFileSync(path.join(serverPath, 'client-stats.json'), JSON.stringify(clientStats))
  })
}
