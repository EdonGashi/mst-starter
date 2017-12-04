import warning from 'utils/warning'

const msg = 'Invalid argument.'

function createExtension(scope) {
  if (scope && scope.indexOf('.') !== -1) {
    throw new Error(msg)
  }

  return function (name, ctor) {
    if (!name || name.indexOf('.') !== -1) {
      throw new Error(msg)
    }

    return function (target) {
      if (!target.__contextExtension) {
        target.__contextExtension = []
      }

      target.__contextExtension.push({ scope, name, ctor })
      return target
    }
  }
}

function hydrate(container, key, node) {
  const snapshot = container['__STATE_' + key]
  warning(key in container, `Key '${key}' already exists in context.`)
  container[key] = node.create(snapshot, container)
  container['__STATE_' + key] = null
  return container
}

const interceptors = {}

function inject(context, component) {
  if (component.__contextExtension) {
    const length = component.__contextExtension.length
    for (let i = length - 1; i >= 0; i--) {
      const { scope, name, ctor } = component.__contextExtension[i]
      let obj
      if (scope) {
        if (!context[scope]) {
          context[scope] = {}
        }

        obj = context[scope]
      } else {
        obj = context
      }

      if (!obj[name]) {
        function createInstance() {
          if (typeof ctor.create === 'function') {
            return ctor.create(undefined, context)
          } else {
            return new ctor(context)
          }
        }

        const fullname = scope ? (scope + '.' + name) : name
        const interceptor = component.__contextInterceptor && component.__contextInterceptor[fullname]
          || interceptors[fullname]

        if (interceptor) {
          obj[name] = interceptor({
            context,
            component,
            getter: createInstance,
            name: fullname
          })
        } else {
          obj[name] = createInstance()
        }
      }
    }
  }

  return component
}

function intercept(name, callback, component) {
  if (typeof name === 'undefined' || typeof callback === 'undefined') {
    throw new Error(msg)
  }

  if (component) {
    if (!component.__contextInterceptor) {
      component.__contextInterceptor = {}
    }

    component.__contextInterceptor[name] = callback
  } else {
    interceptors[name] = callback
  }

  return function () {
    if (component) {
      if (component.__contextInterceptor[name] === callback) {
        component.__contextInterceptor[name] = undefined
      }
    } else {
      if (interceptors[name] === callback) {
        interceptors[name] = undefined
      }
    }
  }
}

const extend = createExtension(null)
export { extend, createExtension, intercept, interceptors, inject }
