import createApp from 'init/createApp'
import errorFormatter from 'error-formatter'
import { createPath } from 'history/PathUtils'

function toPath(location) {
  return typeof location === 'string'
    ? location
    : createPath(location)
}

export default function init() {
  return async function (ctx, next) {
    ctx.render = {
      head: [],
      scripts: []
    }

    let isRedirected = false
    function redirect(location) {
      if (!isRedirected) {
        ctx.redirect(toPath(location))
        isRedirected = true
      }
    }

    const app = createApp(null, {
      __ctx: ctx,
      __fiber: ctx.fiber,
      __redirect: redirect
    })

    ctx.app = app
    if (isRedirected) {
      return
    }

    try {
      await next()
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        ctx.body = errorFormatter(err)
        return
      }

      ctx.throw(err)
    }
  }
}
