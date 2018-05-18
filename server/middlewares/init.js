import createApp from 'init/createApp'
import errorFormatter from 'error-formatter'

export default function init() {
  return async function (ctx, next) {
    ctx.render = {
      head: [],
      scripts: []
    }

    const app = createApp(null, {
      __ctx: ctx,
      __fiber: ctx.fiber
    })

    ctx.app = app
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
