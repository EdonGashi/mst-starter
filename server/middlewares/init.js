import createApp from '../../src/app'

export default function init() {
  return function (ctx, next) {
    ctx.render = {
      head: [],
      scripts: []
    }

    ctx.app = createApp()
    return next()
  }
}
