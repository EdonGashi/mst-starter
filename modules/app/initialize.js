import { AppNode, hydrate } from './tree'
import invariant from 'utils/invariant'

export function createAppFactory(...initializers) {
  return function app(initialState = {}, volatileState = {}, envState = {}) {
    const root = new AppNode(null, initialState, volatileState, envState)
    initializers.forEach(initializer => initializer(root))
    return root
  }
}

export function extendAppFactory(factory, ...initializers) {
  return function (initialState = {}) {
    extend(factory(initialState), ...initializers)
  }
}

export function extend(app, ...initializers) {
  app = app.__root
  initializers.forEach(initializer => initializer(app))
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

export function withEnv(env = {}) {
  return function (app) {
    const appEnv = app.__env
    for (const key in env) {
      appEnv[key] = env[key]
    }
  }
}

export function withVolatile(volatileState = {}) {
  return function (app) {
    const volatile = app.__volatile
    for (const key in volatileState) {
      volatile[key] = volatileState[key]
    }
  }
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
