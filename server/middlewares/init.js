import createApp from 'createApp'
import createHistory from 'history/createMemoryHistory'
import errorFormatter from 'error-formatter'

export default function init() {
  return async function (ctx, next) {
    ctx.render = {
      head: [],
      scripts: []
    }

    const history = createHistory({ initialEntries: [ctx.path] })
    ctx.app = createApp(null, { history })
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
