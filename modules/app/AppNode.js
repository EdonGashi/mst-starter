import { isRoot, getSnapshot } from 'mobx-state-tree'
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

/* eslint-enable indent */

export function hydrate(appNode, path, leaf, env) {
  invariant(appNode instanceof AppNode, 'Item must be an AppNode.')
  const { node, key } = createPath(appNode, path)
  if (key in node) {
    return node[key]
  }

  const snapshot = node['__STATE_' + key]
  let result
  if (typeof leaf === 'function') {
    result = leaf(appNode.__root, env, snapshot)
  } else {
    result = leaf.create(snapshot, { app: appNode.__root, env })
  }

  node[key] = result
  node['__STATE_' + key] = null
  return result
}

export function serialize(appNode) {
  invariant(appNode instanceof AppNode, 'Item must be an AppNode.')
  const result = {}
  for (const key in appNode) {
    if (key === '__root') {
      continue
    }

    const value = appNode[key]
    if (value instanceof AppNode) {
      result[key] = serialize(value)
      continue
    } else if (typeof value === 'function') {
      // May be a helper function.
      continue
    }

    if (key.indexOf('__STATE_') === 0) {
      if (value !== null) {
        // This can happen when state has not been hydrated yet.
        // To prevent potential data loss, we include this value as is.
        result[key] = value
      }

      continue
    }

    if (isRoot(value)) {
      warning(!('__STATE_' + key in appNode), `Key ${key} already exists in context.`)
      result['__STATE_' + key] = getSnapshot(value)
    }
  }

  return result
}

export default class AppNode {
  constructor(root, payload = {}) {
    if (!root) {
      root = this
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
