import { observable, toJS } from 'mobx'
import { withType } from './initialize'

function serializeSelf() {
  return toJS(this)
}

export function makeTypeSerializable(type) {
  type.prototype.serialize = serializeSelf
  return type
}

export function makeInstanceSerializable(instance) {
  Object.defineProperty(instance, 'serialize', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: serializeSelf
  })

  return instance
}

export function withState(initialState = {}, name = 'state', deep = false) {
  return withType(name, {
    create(snapshot) {
      return makeInstanceSerializable(observable.map(
        { ...initialState, ...snapshot },
        { name, deep }))
    }
  })
}
