import invariant from 'utils/invariant'
import universal from 'react-universal-component'
import { matchRoutes } from 'react-router-config'

function noop() { }

function onLoad(opts) {
  const key = opts.key || 'default'
  const wrappedOnLoad = opts.onLoad || noop
  return function (mod) {
    const component = mod[key]
    if (!('dependencies' in component)) {
      component.dependencies = null
    }

    wrappedOnLoad.apply(null, arguments)
  }
}

export function transformRoutes(routesObject) {
  const options = routesObject.options || {}
  invariant(typeof options === 'object', 'Route options must be an object.')

  const named = {}
  const compiledRoutes = []
  routesObject.routes.forEach(route => {
    invariant(
      typeof route.path === 'string' || Array.isArray(route.path),
      'All routes must have a path.')

    route = { ...route }
    if (route.view) {
      const routeOptions = route.options || {}
      invariant(typeof routeOptions === 'object', 'Route options must be an object.')
      const opts = { ...options, ...routeOptions }
      opts.onLoad = onLoad(opts)
      if (route.view) {
        invariant(route.id, 'If a route provides a view it must also include a unique id.')
      }

      if (Array.isArray(route.view)) {
        invariant(route.view.length === 1, 'Invalid view object.')
        route.component = route.view[0]
      } else {
        route.component = universal(route.view, opts)
      }

      if (process.env.IS_SERVER && typeof route.component.preloadWeak === 'function') {
        route.component.preloadWeak()
      }

      if (route.id) {
        named[route.id] = route
      }
    }

    compiledRoutes.push(route)
  })

  const result = []
  compiledRoutes.forEach(route => {
    const path = route.path
    if (typeof route.alias === 'string') {
      route = named[route.alias]
      invariant(route, 'Could not resolve route alias.')
    }

    invariant(route.component, 'Route must provide a view.')

    if (typeof path === 'string') {
      result.push({
        id: route.id,
        component: route.component,
        props: route.props,
        path,
        exact: route.exact !== false,
        beforeEnter: route.beforeEnter || routesObject.beforeEnter,
        status: route.status || routesObject.status
      })
    } else {
      path.forEach(str => {
        invariant(typeof str === 'string', 'Invalid path string in array.')
        result.push({
          id: route.id,
          component: route.component,
          props: route.props,
          path: str,
          exact: route.exact !== false,
          beforeEnter: route.beforeEnter || routesObject.beforeEnter,
          status: route.status || routesObject.status
        })
      })
    }
  })

  const props = routesObject.props || {}
  invariant(typeof options === 'object' || typeof options === 'function', 'Route props must be an object or a function.')
  return {
    props,
    routes: result
  }
}

export class RouteCollection {
  constructor(routesObject) {
    const { props, routes } = transformRoutes(routesObject)
    this.props = props
    this.routes = routes
  }

  match(pathname) {
    const branch = matchRoutes(this.routes, pathname)
    if (branch && branch.length) {
      return branch[0]
    } else {
      return null
    }
  }
}
