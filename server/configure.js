import koaCompose from 'koa-compose'
import { init, fiber, polyfill, render } from './middlewares'
import helmet from 'koa-helmet'
import enforceHttps from 'koa-sslify'
import serve from 'koa-static'
import mount from 'koa-mount'
import favicon from 'koa-favicon'
import path from 'path'
import fs from 'fs'

function here(file) {
  return path.join(__dirname, file)
}

const prod = process.env.NODE_ENV === 'production'

function compose(...middleware) {
  return koaCompose(middleware.filter(m => !!m))
}

const handler = ({ clientStats, publicPath }) => {
  return compose(
    helmet(),
    prod && enforceHttps({}),
    favicon(here('../assets/favicon.png')),
    mount('/assets', serve(here('../assets'))),
    prod && mount(publicPath, serve(here('../build-client'))),
    init(),
    prod && polyfill(),
    fiber(),
    render({ clientStats })
  )
}

export default handler

if (prod && !global.IS_BUILD) {
  const Koa = require('koa')
  const http = require('http')
  const https = require('https')
  const { clientStats, publicPath } = JSON.parse(fs.readFileSync(here('stats.json'), 'utf8'))

  const app = new Koa()
  app.use(handler({
    clientStats,
    publicPath
  }))

  function run(ssl) {
    const httpPort = process.env.KOA_HTTP_PORT || 80
    const httpsPort = process.env.KOA_HTTPS_PORT || 443
    const notify = (port) => (err) => {
      if (err) {
        return console.error(`Error while starting server on port ${port}.`, err)
      }

      console.log(`Listening on port ${port}.`)
    }

    http.createServer(app.callback()).listen(httpPort, notify(httpPort))
    https.createServer(ssl, app.callback()).listen(httpsPort, notify(httpsPort))
  }

  let sync = false
  let key
  let cert
  try {
    key = fs.readFileSync(here('server.key'))
    cert = fs.readFileSync(here('server.crt'))
    sync = true
  } catch (fserr) {
    console.log('Could not find SSL keys, generating keys for testing...')
    const pem = require('pem')
    pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
      if (err) {
        throw err
      }

      run({ key: keys.serviceKey, cert: keys.certificate })
    })
  }

  if (sync) {
    run({ key, cert })
  }
}
