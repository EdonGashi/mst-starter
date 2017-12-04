import { isRoot, getSnapshot } from 'mobx-state-tree'
import SessionRoot from './session'
import invariant from 'utils/invariant'
import warning from 'utils/warning'

function serialize(container) {
  const result = {}
  for (let key in container) {
    const value = container[key]
    if (key.indexOf('__STATE_') === 0) {
      if (value !== null) {
        // This can happen when state has not been hydrated yet.
        // To prevent potential data loss, we include this value as is.
        result[key] = value
      }

      continue
    }

    warning('__STATE_' + key in container, `Key ${key} already exists in context.`)
    invariant(isRoot(value), 'Serialized object must be a root node.')
    result['__STATE_' + key] = getSnapshot(value)
  }

  return result
}

function set(obj, prop, value, enumerable) {
  Object.defineProperty(obj, 'service', {
    configurable: false,
    writable: false,
    enumerable,
    value
  })

  return value
}

class Context {
  constructor(payload) {
    if (typeof payload !== 'object' || payload === null) {
      payload = {}
    }

    set(this, 'service', payload.service || {}, true)
    set(this, '__session', SessionRoot.create(payload.__session), false)
    set(this, '__controller', payload.__controller || {}, false)
  }

  toJSON() {
    return {
      service: serialize(this.service),
      __session: serialize(this.__session),
      __controller: serialize(this.__controller)
    }
  }
}
