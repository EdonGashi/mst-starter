import createApp from 'init/createApp'
import { stringify } from 'utils/error'
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

    let responseSent = false
    function redirect(location) {
      if (!responseSent) {
        responseSent = true
        ctx.redirect(toPath(location))
      }
    }

    function forbidden() {
      if (!responseSent) {
        responseSent = true
        ctx.status = 403
      }
    }

    const app = createApp(null,
      {
        __ctx: ctx,
        __fiber: ctx.fiber,
        __redirect: redirect,
        __forbidden: forbidden
      },
      {
        initialRender: false,
        serverRender: true
      })

    ctx.app = app
    if (responseSent) {
      return
    }

    try {
      await next()
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        ctx.status = 500
        ctx.body = stringify(err)
        return
      }

      ctx.throw(err)
    }
  }
}
