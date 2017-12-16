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
