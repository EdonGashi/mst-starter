import hook from './internal/hook'
import combinePaths from './internal/combinePaths'

export default function viewModel(name, type, env) {
  return hook(combinePaths('viewModel', name), 'viewModel', type, env)
}
