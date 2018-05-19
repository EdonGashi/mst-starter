import Fiber from 'fibers'
import { fromPromise } from 'mobx-utils'
import warning from 'utils/warning'
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
    const app = this && this.$app
    if (app && typeof app.__volatile.__asyncFrame !== 'number') {
      app.__volatile.__asyncFrame = 0
    }

    let promise
    try {
      promise = fn.apply(this, arguments)
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err)
      }

      return (wrap ? fromPromise : Promise).reject(err)
    }

    if (!promise || typeof promise.then !== 'function') {
      return (wrap ? fromPromise : Promise).resolve(promise)
    }

    if (wrap) {
      promise = fromPromise(promise)
    }

    if (!app) {
      const fiber = Fiber.current
      function error(err) {
        if (process.env.NODE_ENV === 'development') {
          console.error(err)
        }

        fiber.run()
      }

      function run() {
        fiber.run()
      }

      if (fiber) {
        promise.then(run, error)
        Fiber.yield()
      }
    } else {
      const frame = ++app.__volatile.__asyncFrame
      function onFinishError(err) {
        if (process.env.NODE_ENV === 'development') {
          console.error(err)
        }

        const newFrame = --app.__volatile.__asyncFrame
        warning(newFrame >= 0, 'Mismatched flow pairs. This will cause invalid states and memory leaks.')
        if (newFrame === 0) {
          app.__volatile.__fiber.run()
        }
      }

      function onFinish() {
        const newFrame = --app.__volatile.__asyncFrame
        warning(newFrame >= 0, 'Mismatched flow pairs. This will cause invalid states and memory leaks.')
        if (newFrame === 0) {
          app.__volatile.__fiber.run()
        }
      }

      promise.then(onFinish, onFinishError)
      if (frame === 1) {
        invariant(Fiber.current && Fiber.current === app.__volatile.__fiber, 'An async flow has been initiated from outside a render frame.')
        Fiber.yield()
      }
    }

    return promise
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
