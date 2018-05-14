import { getPolyfillString } from 'polyfill-service'

export default function polyfill() {
  return async function (ctx, next) {
    const uaString = ctx.request.header['user-agent']
    const polyfillPromise = uaString && getPolyfillString({
      uaString,
      minify: process.env.NODE_ENV === 'production',
      features: { 'es6': {} }
    })

    let polyfillString = null
    if (polyfillPromise) {
      polyfillString = await polyfillPromise
      if (process.env.NODE_ENV === 'production' && typeof polyfillString === 'string') {
        polyfillString = polyfillString.substr(72) // Removes minification info line.
      }
    }

    if (polyfillString) {
      ctx.render.scripts.push('<script>' + polyfillString + '</script>')
    }

    return next()
  }
}
