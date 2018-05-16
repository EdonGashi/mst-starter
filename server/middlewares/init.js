import createApp from 'init/createApp'
import createHistory from 'history/createMemoryHistory'
import errorFormatter from 'error-formatter'

export default function init() {
  return async function (ctx, next) {
    ctx.render = {
      head: [],
      scripts: []
    }

    const history = createHistory({ initialEntries: [ctx.path] })
    const app = createApp(null, {
      __ctx: ctx
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
