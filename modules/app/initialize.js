import { hydrate } from './tree'
import invariant from 'utils/invariant'

export default function initialize(path, leaf, env) {
  invariant(leaf, 'Invalid leaf argument. Accepts only functions and mst types.')
  return function (app) {
    hydrate(app, path, leaf, env)
  }
}
