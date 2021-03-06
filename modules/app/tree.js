import invariant from 'utils/invariant'
import { toJS } from 'mobx'
// For mst support enable this
// import { isStateTreeNode, getSnapshot } from 'mobx-state-tree'

function splitPath(path) {
  if (Array.isArray(path)) {
    return path
  } else if (typeof path === 'string') {
    return path.split('.')
  } else {
    throw new Error('Invalid path.')
  }
}

/* eslint-disable indent */

function createPath(appNode, path) {
  path = splitPath(path)
  switch (path.length) {
    case 0: throw new Error('Invalid path.')
    case 1: return { node: appNode, key: path[0] }
    default: {
      const root = appNode.__root
      const max = path.length - 1
      let node = appNode
      for (let i = 0; i < max; i++) {
        const key = path[i]
        if (!(key in node)) {
          const newNode = new AppNode(root, node['__STATE_' + key])
          node[key] = newNode
          node = newNode
        } else {
          invariant(node instanceof AppNode, 'A node in path is found to be a non AppNode.')
          node = node[key]
        }
      }

      return {
        node,
        key: path[max]
      }
    }
  }
}

function initMiddleware(instance, app) {
  const middleware = app.__volatile.__middleware
  if (middleware) {
    middleware.forEach(m => m(instance, app))
  }
}

function buildEnv(app, env) {
  if (typeof env === 'function') {
    return env(app)
  } else if (env && typeof env === 'object') {
    return env
  } else {
    return {}
  }
}

export function setHidden(obj, prop, value) {
  Object.defineProperty(obj, prop, {
    enumerable: false,
    configurable: true,
    writable: true,
    value
  })
}

export function getLeaves(node, arr = []) {
  if (node instanceof AppNode) {
    const keys = Object.keys(node)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (key.indexOf('__') === 0) {
        continue
      }

      getLeaves(node[key], arr)
    }
  } else if (node) {
    arr.push(node)
  }

  return arr
}

export function resolveDependencies(appNode, dependencies, env) {
  invariant(dependencies && typeof dependencies === 'object', 'Invalid dependencies object.')
  const app = appNode.__root
  env = buildEnv(app, env)
  for (const dependency in dependencies) {
    let childType = dependencies[dependency]
    let childEnv
    if (Array.isArray(childType)) {
      childEnv = { ...env, ...buildEnv(app, childType[1]) }
      childType = childType[0]
    } else {
      childEnv = env
    }

    hydrate(app, dependency, childType, childEnv)
  }
}

export function construct(appNode, type, snapshot, env) {
  const app = appNode.__root
  env = buildEnv(app, env)
  if (type.dependencies && typeof type.dependencies === 'object') {
    resolveDependencies(app, type.dependencies, env)
  }

  let result
  if (typeof type.create === 'function') {
    result = type.create(snapshot, { app, env })
  } else if (typeof type === 'function') {
    result = new type(snapshot, app, env)
  } else {
    invariant(false, 'Invalid type provided for construction.')
  }

  if (result && typeof result === 'object') {
    setHidden(result, '$app', app)
  }

  initMiddleware(result, app)
  return result
}

export function hydrate(appNode, path, type, env) {
  invariant(appNode instanceof AppNode, `Item being hydrated must be an AppNode, got '${appNode}' instead.`)
  invariant(type, `Invalid type provided for hydration in path '${path}'.`)
  const { node, key } = createPath(appNode, path)
  if (key in node) {
    return node[key]
  }

  const app = appNode.__root
  let snapshot = node['__STATE_' + key]
  if (typeof snapshot === 'undefined') {
    snapshot = null
  }

  const result = construct(app, type, snapshot, env)
  node[key] = result
  node['__STATE_' + key] = null
  return result
}

export function serialize(appNode, flag = null) {
  invariant(appNode instanceof AppNode, 'Item being serialized must be an AppNode.')
  const result = {}
  for (const key in appNode) {
    const value = appNode[key]
    if (key.indexOf('__STATE_') === 0) {
      if (value !== null) {
        // This can happen when state has not been hydrated yet.
        // To prevent potential data loss, we include this value as is.
        result[key] = value
      }

      continue
    } else if (key.indexOf('__') === 0) {
      continue
    }

    if (value instanceof AppNode) {
      result[key] = serialize(value)
      continue
    }

    let snapshot
    // For mst support enable this
    // if (isStateTreeNode(value)) {
    //   snapshot = getSnapshot(value)
    // } else 
    if (typeof value.toJSON === 'function') {
      snapshot = value.toJSON(flag)
    } else {
      snapshot = toJS(value)
    }

    if (snapshot !== undefined && snapshot !== null) {
      result['__STATE_' + key] = snapshot
    }
  }

  return result
}

export class AppNode {
  constructor(root, payload = {}, volatileState = {}, envState = {}) {
    if (!root) {
      root = this
      setHidden(this, '__volatile', { ...volatileState })
      setHidden(this, '__env', { ...envState })
    }

    setHidden(this, '__root', root)
    for (const key in payload) {
      if (key.indexOf('__STATE_') === 0) {
        this[key] = payload[key]
      } else {
        this[key] = new AppNode(root, payload[key])
      }
    }
  }

  toJSON() {
    return serialize(this)
  }
}
