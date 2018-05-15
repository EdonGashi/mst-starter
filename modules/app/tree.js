import invariant from 'utils/invariant'
import { toJS } from 'mobx'
import { isStateTreeNode, isRoot, getSnapshot } from 'mobx-state-tree'

function splitPath(path) {
  if (path instanceof Array) {
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
    middleware.forEach(m => m(root, app))
  }
}

export function getLeaves(node, arr = []) {
  if (node instanceof AppNode) {
    const keys = Object.keys(node)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (key.indexOf('__') === 0) {
        continue
      }

      getLeaves(node[key])
    }
  } else if (node) {
    arr.push(node)
  }

  return arr
}

/* eslint-enable indent */

export function hydrate(appNode, path, type, env = {}) {
  invariant(appNode instanceof AppNode, `Item being hydrated must be an AppNode, got ${appNode} instead.`)
  invariant(type, `Invalid type provided for hydration in path '${path}'.`)
  const { node, key } = createPath(appNode, path)
  if (key in node) {
    return node[key]
  }

  const snapshot = node['__STATE_' + key]
  const app = appNode.__root
  if (type.dependencies && typeof type.dependencies === 'object') {
    const dependencies = type.dependencies
    for (const dependency in dependencies) {
      let childType = dependencies[dependency]
      let childEnv
      if (Array.isArray(childType)) {
        childEnv = childType[1] || {}
        childEnv = { ...env, ...childEnv }
        childType = childType[0]
      } else {
        childEnv = env
      }

      hydrate(app, dependency, childType, childEnv)
    }
  }

  let result
  if (typeof type.create === 'function') {
    result = type.create(snapshot, { app, env })
  } else if (typeof type === 'function') {
    result = new type(snapshot, { app, env })
  } else {
    invariant(false, `Invalid type provided for hydration in path '${path}'.`)
  }

  if (result && typeof result === 'object') {
    Object.defineProperty(result, '$app', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: app
    })
  }

  initMiddleware(result, app)
  node[key] = result
  node['__STATE_' + key] = null
  return result
}

export function serialize(appNode) {
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

    if (isStateTreeNode(value) && isRoot(value)) {
      result['__STATE_' + key] = getSnapshot(value)
    } else if (typeof value.toJSON === 'function') {
      result['__STATE_' + key] = value.toJSON()
    } else {
      result['__STATE_' + key] = toJS(value)
    }
  }

  return result
}

export class AppNode {
  constructor(root, payload = {}) {
    if (!root) {
      root = this
      this.__volatile = {}
      this.__env = {}
    }

    this.__root = root
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
