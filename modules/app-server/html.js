// import config from '../../config'

// if (!process.env.DEV) {
//   const path = require('path')
//   const fs = require('fs')
//   const buildPath = config.http.static['/build']
//   const stats = JSON.parse(fs.readFileSync(path.resolve(buildPath, 'stats.json'), 'utf8'))
//   global.BUILD_HASH = stats.hash
//   global.BUILD_MANIFEST = fs.readFileSync(path.resolve(buildPath, `manifest.${stats.hash}.js`), 'utf8')
// }

function stringify(s) {
  return JSON.stringify(s)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/</g, '\\u003c')
}

export default function serverHtml() {
  
}

export default function html(context, content, chunk) {
  const { state, bodyClass } = context
  // const title = state.common.title || 'Sonia'
  // const bundlePath = state.common.bundle
  // const bodyClassAssign = bodyClass ? ` class="${bodyClass}"` : ''
  // const hash = global.BUILD_HASH ? '.' + global.BUILD_HASH : ''
  if (chunk) {
    chunk = `\n  <script type="text/javascript" defer="" src="${bundlePath}/build/${chunk}.chunk${hash}.js"></script>`
  }

  return (
    `<!DOCTYPE html>
<html>
<head>
  <meta charSet="utf-8" />
  <title>${title}</title>
  <meta name="title" content="${title}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="build" content="${config.build}" />
  <link rel="apple-touch-icon" sizes="76x76" href="https://sonia.ai/images/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="https://sonia.ai/images/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="https://sonia.ai/images/favicon-16x16.png">
  <link href="${bundlePath}/build/bundle.css" rel="stylesheet" media="all" />
</head>
<body${bodyClassAssign}>
  <div id="root">${content || ''}</div>
  <script type="text/javascript">window.__STATE=(${stringify(state)});</script>
  ${global.BUILD_MANIFEST ? `<script type="text/javascript">${global.BUILD_MANIFEST}</script>` : `<script type="text/javascript" src="${bundlePath}/build/manifest${hash}.js"></script>`}
  <script type="text/javascript" defer="" src="https://apis.google.com/js/api.js"></script>
  <script type="text/javascript" defer="" src="${bundlePath}/build/vendor${hash}.js"></script>${chunk || ''}
  <script type="text/javascript" defer="" src="${bundlePath}/build/main${hash}.js"></script>
</body>
</html>
`)
}
