import { lifecycle } from 'recompose'
import { hydrate } from 'app/tree'
import invariant from 'utils/invariant'
import wait from 'utils/wait'

export default function hook(path, name, type, env) {
  invariant(type && type.create, 'Invalid leaf argument. Accepts only mst types.')
  return lifecycle({
    componentWillMount() {
      const { app } = this.context
      invariant(app, 'App root not found in context. Make sure to add a context provider.')
      let finalPath = path
      if (typeof path === 'function') {
        finalPath = path(this, app)
      }

      const viewModel = hydrate(app, finalPath, type, env)
      this.setState({ [name]: viewModel })
      if (viewModel.componentWillMount) {
        wait(viewModel.componentWillMount())
      }
    },
    getChildContext() {
      return {
        [name]: this.state[name]
      }
    }
  })
}
