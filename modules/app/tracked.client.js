import { fromPromise } from 'mobx-utils'
import invariant from 'utils/invariant'

export function tracked(arg1, arg2, arg3, arg4) {
  const len = arguments.length
  if (len === 1 && typeof arg1 === 'function') {
    return trackedFunction(arg1, true)
  }

  if (len === 2 && typeof arg2 === 'function') {
    return trackedFunction(!!arg1, arg2)
  }

  if (len === 1 || typeof arg1 === 'boolean') {
    return trackedFunctionDecorator(arg1)
  }

  if (arg4 === true) {
    arg1[arg2] = trackedFunction(true, arg3.value)
  } else {
    return trackedFunctionDecorator(true).apply(null, arguments)
  }
}

function trackedFunction(wrap, fn) {
  return function asyncTracker() {
    let promise
    try {
      promise = fn.apply(this, arguments)
    } catch (err) {
      return (wrap ? fromPromise : Promise).reject(err)
    }

    if (!promise || typeof promise.then !== 'function') {
      return (wrap ? fromPromise : Promise).resolve(promise)
    }

    return wrap ? fromPromise(promise) : promise
  }
}

function trackedFunctionDecorator(wrap) {
  return function (target, prop, descriptor) {
    invariant(descriptor.get === undefined, 'Cannot apply decorator on getters.')
    if (descriptor.value) {
      return {
        value: trackedFunction(wrap, descriptor.value),
        enumerable: false,
        configurable: true,
        writable: true
      }
    }

    const { initializer } = descriptor
    return {
      enumerable: false,
      configurable: true,
      writable: true,
      initializer() {
        return trackedFunction(wrap, initializer.call(this))
      }
    }
  }
}
