import { inject as mobxInject } from 'mobx-react'
import get from 'lodash/get'
import toPath from 'lodash/toPath'

function fromPaths(paths, useApp) {
  return function (stores, props) {
    paths.forEach(function (path) {
      const index = path.indexOf('=')
      let storeName
      if (index === -1) {
        const pathArray = toPath(path)
        storeName = pathArray[pathArray.length - 1]
      } else {
        storeName = path.substr(0, index)
        path = path.substr(index + 1)
      }

      if (storeName in props) {
        return
      }

      const object = get(useApp ? stores.root.app : stores, path)
      if (typeof object !== 'undefined') {
        props[storeName] = object
      } else {
        throw new Error(`Could not find '${path}' in context.`)
      }
    })

    return props
  }
}

export function injectContext(...stores) {
  return mobxInject(fromPaths(stores, false))
}

export function inject(...stores) {
  return mobxInject(fromPaths(stores, true))
}

inject.volatile = function () {
  return inject('volatile=__volatile')
}

inject.env = function () {
  return inject('env=__env')
}

inject.app = function () {
  return injectContext('root.app')
}

inject.root = function () {
  return mobxInject('root')
}
