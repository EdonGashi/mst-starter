import { types } from 'mobx-state-tree'
import initialize from './initialize'

const type = types.map(types.frozen)
return function withState(initialState = {}, name = 'state') {
  return initialize(name, function (app, env, snapshot) {
    return type.create({ ...initialState, ...snapshot })
  })
}
