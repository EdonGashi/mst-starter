import compose from 'koa-compose'
import { init, fiber, polyfill, render } from './middlewares'
import helmet from 'koa-helmet'

import { useStaticRendering } from 'mobx-react'
useStaticRendering(true)

export default ({ clientStats }) => {
  return compose([
    helmet(),
    init(),
    ...(process.env.NODE_ENV === 'production' ? [polyfill()] : []),
    fiber(),
    render({ clientStats })
  ])
}
