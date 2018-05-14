import { inject as mobxInject } from 'mobx-react'
import get from 'lodash/get'
import toPath from 'lodash/toPath'

const msg = (path) => `An error occurred while injecting '${path}'.`

function fromPaths(paths, useApp) {
  return function (baseStores, nextProps) {
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

      if (storeName in nextProps) {
        return
      }

      const object = get(useApp ? baseStores.app : baseStores, path)
      if (object) {
        nextProps[storeName] = object
      } else {
        throw new Error(msg(path))
      }
    })

    return nextProps
  }
}

export function inject(...stores) {
  return mobxInject(fromPaths(stores, true))
}

export function injectContext(...stores) {
  return mobxInject(fromPaths(stores, false))
}
