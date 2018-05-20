import React from 'react'
import ReactDOM from 'react-dom/server'
import { serialize } from 'app'
import App from 'init/App'
import { Provider, useStaticRendering } from 'mobx-react'
import { ReportChunks } from 'react-universal-component'
import { HelmetProvider } from 'react-helmet-async'
import flushChunks, { filesFromChunks } from 'webpack-flush-chunks'
import fs from 'fs'
import path from 'path'

useStaticRendering(true)

function readBootstrap(manifestName) {
  const bootstrap = fs
    .readFileSync(path.join(__dirname, '../build-client', manifestName), 'utf8')
    .replace('//# sourceMappingURL=bootstrap.', '//# sourceMappingURL=/static/bootstrap.')
  return bootstrap
}

function stringify(value) {
  return JSON.stringify(value)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/</g, '\\u003c')
}

function merge(array) {
  if (array) {
    return array.join('\n')
  }

  return ''
}

export default function render({ clientStats }) {
  const serverRender = process.env.RENDER !== 'client'
  const clientRender = process.env.RENDER !== 'server'
  const manifestName = filesFromChunks(['bootstrap'], clientStats.assetsByChunkName)[0]
  let bootstrap
  if (process.env.NODE_ENV === 'production') {
    bootstrap = '<script>' + readBootstrap(manifestName) + '</script>'
  } else {
    bootstrap = `<script src="/static/${manifestName}"></script>`
  }

  return function (ctx) {
    const renderopts = ctx.render || {}
    if (!serverRender) {
      const { js, styles, cssHash } = flushChunks(clientStats, { chunkNames: [], before: ['vendor'] })
      ctx.body = `<!DOCTYPE html>
<html>
<head>
<title>App</title>
${merge(renderopts.head)}
${styles}
</head>
<body>
<div id="root"></div>
${merge(renderopts.scripts)}
${bootstrap}
<script>window.__SSR__=false</script>
${cssHash}
${js}
</body>
</html>`
      return
    }

    const app = ctx.app
    const helmetContext = {}
    let chunkNames = new Set()
    const domString = ReactDOM.renderToString(
      <ReportChunks report={chunkName => chunkNames.add(chunkName)}>
        <HelmetProvider context={helmetContext}>
          <Provider root={{ app }}>
            <App app={app} />
          </Provider>
        </HelmetProvider>
      </ReportChunks>
    )

    chunkNames = Array.from(chunkNames)
    const { js, styles, cssHash } = flushChunks(clientStats, { chunkNames, before: ['vendor'] })
    const { helmet } = helmetContext

    let bodyString
    if (!clientRender || app.__volatile.__serverOnly || renderopts.serverOnly) {
      bodyString = `<!DOCTYPE html>
<html ${helmet.htmlAttributes.toString()}>
<head>
  ${helmet.meta.toString()}
  ${helmet.title.toString()}
  ${merge(renderopts.head)}
  ${styles}
  ${helmet.link.toString()}
</head>
<body ${helmet.bodyAttributes.toString()}>
<div id="root">${domString}</div>
</body>
</html>`
    } else {
      bodyString = `<!DOCTYPE html>
<html ${helmet.htmlAttributes.toString()}>
<head>
  ${helmet.meta.toString()}
  ${helmet.title.toString()}
  ${merge(renderopts.head)}
  ${styles}
  ${helmet.link.toString()}
</head>
<body ${helmet.bodyAttributes.toString()}>
<div id="root">${domString}</div>
${merge(renderopts.scripts)}
${bootstrap}
<script>window.__STATE__=${stringify(serialize(app))}</script>
${cssHash}
${js}
</body>
</html>`
    }

    const status = app.__volatile.__status
    if (status && !isNaN(status) && isFinite(status)) {
      ctx.status = status
    }

    ctx.body = bodyString
  }
}
