import { observable } from 'mobx'
import { withType } from '../initialize'

export function withMap(name = 'state', initialState = {}, deep = false) {
  return withType(name, {
    create(snapshot = {}) {
      return observable.map(
        { ...initialState, ...snapshot },
        { name, deep })
    }
  })
}
