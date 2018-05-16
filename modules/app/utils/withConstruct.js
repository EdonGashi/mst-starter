import { construct } from '../tree'
import { withFunction } from '../initialize'

export function withConstruct(name = 'construct') {
  return withFunction(name, function (type, snapshot, env = {}) {
    return construct(this, type, snapshot, env)
  })
}
