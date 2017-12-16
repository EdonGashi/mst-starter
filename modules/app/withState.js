import { types } from 'mobx-state-tree'
import initialize from './initialize'

return function withState(initialState = {}, name = 'state') {
  return initialize(name, function (app, env, snapshot) {
    return types.map(types.frozen).create({ ...initialState, snapshot })
  })
}
