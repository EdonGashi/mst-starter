import { lifecycle } from 'recompose'
import { hydrate } from 'app/tree'
import invariant from 'utils/invariant'

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
      if (!viewModel.componentWillMount) {
        return
      }

      const result = viewModel.componentWillMount()
      if (result && result.then) {
        result
          .then(() => {
            app.__volatile.fiber.run()
          })
          .catch(err => {
            app.__volatile.fiber.throwInto(err)
          })
      }

      app.__volatile.fiber.yield()
    },
    getChildContext() {
      return {
        [name]: this.state[name]
      }
    }
  })
}
