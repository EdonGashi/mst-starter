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
      if (app.__env.initialRender) {
        viewModel.initialComponentWillMount && viewModel.initialComponentWillMount()
      } else {
        viewModel.componentWillMount && viewModel.componentWillMount()
      }
    },
    componentDidMount() {
      const { app } = this.context
      invariant(app, 'App root not found in context. Make sure to add a context provider.')
      const viewModel = this.state[name]
      if (app.__env.initialRender) {
        viewModel.initialComponentDidMount && viewModel.initialComponentDidMount()
      } else {
        viewModel.componentDidMount && viewModel.componentDidMount()
      }
    },
    componentWillUnmount() {
      const viewModel = this.state[name]
      viewModel.componentWillUnmount && viewModel.componentWillUnmount()
    },
    getChildContext() {
      return {
        [name]: this.state[name]
      }
    }
  })
}
