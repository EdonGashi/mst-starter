import { AppNode, hydrate, setHidden } from './tree'
import invariant from 'utils/invariant'

export function createAppFactory(...initializers) {
  return function app(initialState, volatileState, envState) {
    const root = new AppNode(null, initialState, volatileState, envState)
    initializers.forEach(initializer => initializer(root))
    return root
  }
}

export function extendAppFactory(factory, ...initializers) {
  return function (...args) {
    return extend(factory(...args), ...initializers)
  }
}

export function extend(app, ...initializers) {
  app = app.__root
  initializers.forEach(initializer => initializer(app))
  return app
}

export function withType(path, type, env) {
  invariant(type, 'Invalid leaf argument. Accepts only functions and mst types.')
  return function (app) {
    hydrate(app, path, type, env)
  }
}

export function withMiddleware(...middleware) {
  return function (app) {
    if (app.__volatile.__middleware) {
      app.__volatile.__middleware.push(...middleware)
    } else {
      app.__volatile.__middleware = [...middleware]
    }
  }
}

function assign(path, param) {
  if (typeof param === 'object') {
    param = { ...param }
  }

  return function (app) {
    const arg = typeof param === 'function'
      ? param(app)
      : param

    if (typeof arg === 'object') {
      const target = app[path]
      for (const key in arg) {
        target[key] = param[key]
      }
    }
  }
}

export function withEnv(env) {
  return assign('__env', env)
}

export function withVolatile(state) {
  return assign('__volatile', state)
}

export function withGetter(name, getter) {
  return function (app) {
    invariant(!(name in app), 'Key already exists in app.')
    Object.defineProperty(app, name, {
      enumerable: false,
      configurable: true,
      get: getter
    })
  }
}

export function withFunction(name, func) {
  return function (app) {
    setHidden(app, name, func.bind(app))
  }
}
