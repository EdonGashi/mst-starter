import { lifecycle } from 'recompose'
import { hydrate } from 'app/tree'
import invariant from 'utils/invariant'

export default function extend(path, leaf, env) {
  return lifecycle({
    componentWillMount() {
      const { app } = this.context
      invariant(app, 'App root not found in context. Make sure to add a context provider.')
      hydrate(app, path, leaf, env)
    }
  })
}

extend.many = function extendMany(extensions, env) {
  return lifecycle({
    componentWillMount() {
      const { app } = this.context
      invariant(app, 'App root not found in context. Make sure to add a context provider.')
      const len = extensions.length
      for (let i = 0; i < len; i++) {
        const { path, leaf } = extensions[i]
        hydrate(app, path, leaf, env)
      }
    }
  })
}
