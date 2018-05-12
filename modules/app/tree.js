import { isRoot, getSnapshot, destroy as destroyMst } from 'mobx-state-tree'
import invariant from 'utils/invariant'
import warning from 'utils/warning'

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
          node[key] = new AppNode(root, node['__STATE_' + key])
        } else {
          node = node[key]
          invariant(node instanceof AppNode, 'A node in path is found to be a non AppNode.')
        }
      }

      return {
        node,
        key: path[max]
      }
    }
  }
}

function initMiddleware(root, app) {
  const middleware = app.__volatile.middleware
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

export function destroy(appNode) {
  getLeaves(appNode).forEach(leaf => {
    if (isRoot(leaf)) {
      destroyMst(leaf)
    }
  })
}

/* eslint-enable indent */

export function hydrate(appNode, path, leaf, env) {
  invariant(appNode instanceof AppNode, `Item being hydrated must be an AppNode, got ${appNode} instead.`)
  const { node, key } = createPath(appNode, path)
  if (key in node) {
    return node[key]
  }

  const snapshot = node['__STATE_' + key]
  let result
  const app = appNode.__root
  if (typeof leaf === 'function') {
    result = leaf(app, env, snapshot)
  } else {
    result = leaf.create(snapshot, { app, env })
  }

  if (isRoot(result)) {
    initMiddleware(result, app)
  }

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

    if (isRoot(value)) {
      result['__STATE_' + key] = getSnapshot(value)
    }
  }

  return result
}

export class AppNode {
  constructor(root, payload = {}) {
    if (!root) {
      root = this
      this.__volatile = {}
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
