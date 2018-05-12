
import compose from 'koa-compose'
import { init, fiber, polyfill, render } from './middlewares'

import { useStaticRendering } from 'mobx-react'
useStaticRendering(true)

export default ({ clientStats }) => {
  return compose([
    init(),
    polyfill(),
    fiber(),
    render({ clientStats })
  ])
}
