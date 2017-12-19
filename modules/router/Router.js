import { types as t, getEnv, flow } from 'mobx-state-tree'
import { matchRoutes } from 'react-router-config'
import * as qs from 'qs-fork'
import { encode, decode } from 'utils/string-encoding'
import { getLeaves } from 'app/tree'
import warning from 'utils/warning'
import memoize from 'utils/memoize'
import { parsePath, createPath } from 'history/PathUtils'

function tryDecode(s) {
  if (typeof s === 'string' && s.length > 0) {
    try {
      return { state: decode(s), isValidState: true }
    } catch {
      return { state: null, isValidState: false }
    }
  } else {
    return { state: null, isValidState: true }
  }
}

function merge(query, state) {
  if (state !== undefined && state !== null) {
    state = encode(state)
    if (!query) {
      return { _state: state }
    }

    if (typeof query === 'string') {
      query = qs.parse(query)
    } else if (typeof query !== 'object') {
      warning(false, 'Invalid query object.')
      return { _state: state }
    }

    warning(!('_state' in query), 'Query object should not contain key \'_state\' because it will be overwritten by state.')
    return qs.stringify({ ...query, _state: state })
  } else if (query !== null && typeof query === 'object') {
    return qs.stringify(query)
  } else if (typeof query === 'string') {
    return query
  } else {
    return ''
  }
}

function createLocation(path, query, state, hash) {
  const { pathname, search: searchStr, hash: hashStr } = parsePath(path)
  warning(query && searchStr, 'A query string is found in path. This will be overwritten because \'query\' parameter exists in location.')
  warning(hash && hashStr, 'A hash string is found in path. This will be overwritten because \'hash\' parameter exists in location.')
  return {
    pathname,
    search: merge(query || searchStr, state),
    hash: hash || hashStr
  }
}

function transformLocation(arg) {
  if (typeof arg === 'string') {
    return arg
  } else if (arg !== null && typeof arg === 'object') {
    const {
      path,
      query,
      state,
      hash
    } = arg
    return createLocation(path, query, state, hash)
  } else if (arg instanceof Array) {
    const [path, query, state, hash] = arg
    return createLocation(path, query, state, hash)
  } else {
    throw new Error('Invalid location.')
  }
}

const Location = t
  .model('Location', {
    pathname: t.string,
    hash: t.string,
    query: t.frozen,
    state: t.frozen,
    isValidState: t.boolean
  })

const Match = t
  .model('Match', {
    path: t.string,
    url: t.string,
    isExact: t.boolean,
    params: t.frozen
  })

export const Router = t
  .model('Router', {
    location: t.maybe(Location),
    match: t.maybe(Match),
    action: t.maybe(t.string)
  })
  .volatile(() => {
    return {
      history: null,
      routes: [],
      currentRoute: null
    }
  })
  .extend(self => {
    const { app, env } = getEnv(self)
    let unlisten
    let unblock

    let locked = false

    let confirmLocation
    let confirmAction
    let confirmCallback
    function confirmation(message, callback) {
      confirmCallback = callback
      self._beforeHistoryUpdate()
    }

    function wrap(func) {
      return function (arg) {
        try {
          return func(arg)
        } catch (err) {
          warning(false, 'A controller method threw an unhandled exception. Lifecycle methods should never throw.')
          if (process.env.NODE_ENV !== 'production') {
            console.error(err)
          }
        }
      }
    }

    const getMatch = memoize(function (pathname) {
      const branch = matchRoutes(self.routes, pathname)
      if (branch && branch.length) {
        const { route, match } = branch[0]
        return {
          route,
          match: Match.create(match)
        }
      } else {
        return null
      }
    })

    const getLocation = memoize(function (location) {
      const { _state, ...query } = qs.parse(location.search || '')
      const { state, isValidState } = tryDecode(_state)
      return Location.create({
        pathname: location.pathname,
        hash: location.hash,
        query,
        state,
        isValidState
      })
    })

    return {
      views: {
        get controllerTree() {
          const route = self.currentRoute
          if (route) {
            const key = route.aliasFor || route.path
            if (app.controller && key in app.controller) {
              return app.controller[key]
            }
          }

          return null
        }
      },

      actions: {
        afterCreate() {
          const {
            createHistory,
            historyProps = {},
            routes
          } = env

          self.history = createHistory({
            ...historyProps,
            getUserConfirmation: confirmation
          })

          self.routes = routes
          unblock = history.block(function (location, action) {
            confirmLocation = location
            confirmAction = action
            return 'Cannot perform this action.'
          })

          unlisten = history.listen(self._onHistoryUpdate)
        },

        beforeDestroy() {
          unblock && unblock()
          unlisten && unlisten()
          unblock = null
          unlisten = null
        },

        push(path) {
          self.history.push(transformLocation(path))
        },

        replace(path) {
          self.history.replace(transformLocation(path))
        },

        go(n) {
          self.history.go(n)
        },

        goBack() {
          self.history.goBack()
        },

        goForward() {
          self.history.goForward()
        },

        _beforeHistoryUpdate: flow(function* () {
          const location = confirmLocation
          const action = confirmAction
          let callback = confirmCallback
          confirmLocation = null
          confirmAction = null
          confirmCallback = null
          if (locked) {
            warning(false, 'Attempted to modify locked history.')
            callback && callback(false)
            return
          }

          if (!(location && action && callback)) {
            warning(false, 'A route transition has occurred outside of the router cycle. You should not update the underlying history manually.')
            return
          }

          if (process.env.SERVER) {
            const wrapped = callback
            callback = function (ok) {
              if (ok) {
                if (self.location) {
                  // TODO: HTTP Redirect
                } else {
                  return wrapped(ok)
                }
              } else {
                return wrapped(ok)
              }
            }
          }

          locked = true
          const param = {
            action: action,
            location: getLocation(location),
            match: null,
            isUpdate: false
          }

          const branch = getMatch(location.pathname)
          let route = null
          if (branch) {
            route = branch.route
            param.match = branch.match
            param.isUpdate = route === self.currentRoute
          }

          let shouldContinue = true
          const oldController = self.controllerTree
          if (oldController) {
            const controllers = getLeaves(oldController)
            for (let i = 0; i < controllers.length; i++) {
              const controller = controllers[i]
              if (controller.beforeLeave) {
                try {
                  let result = controller.beforeLeave(param)
                  if (result && result.then) {
                    result = yield result
                  }

                  if (result === false) {
                    shouldContinue = false
                    break
                  } else if (result === true) {
                    continue
                  } else {
                    warning(false, 'beforeLeave() should return either true or false.')
                  }
                } catch (err) {
                  warning(false, 'beforeLeave() threw an unhandled exception. Lifecycle methods should never throw.')
                  if (process.env.NODE_ENV !== 'production') {
                    console.error(err)
                  }

                  continue
                }
              }
            }
          }

          if (!shouldContinue) {
            locked = false
            callback(false)
            return
          }

          if (!route) {
            locked = false
            callback(true)
            return
          }

          if (route.beforeEnter) {
            let result
            try {
              result = route.beforeEnter({
                ...param,
                app
              }) // We can pass app since this is not a mst node.
              if (result && result.then) {
                result = yield result
              }
            } catch (err) {
              warning(false, `beforeEnter() in '${route.path}' threw an unhandled exception. Lifecycle methods should never throw.`)
              if (process.env.NODE_ENV !== 'production') {
                console.error(err)
              }

              callback(false)
              locked = false
              return
            }

            if (typeof result === 'boolean') {
              if (result) {
                locked = false
                callback(true)
              } else {
                warning(false, 'You should not return false from beforeEnter(). This may result in 404 errors if an initial route rejects entering.')
                callback(false)
                locked = false
              }
            } else if (result && typeof result === 'object' || typeof result === 'string') {
              callback(false)
              locked = false
              if (result.action === 'push' || result.action === 'PUSH') {
                self.push(result.location || result)
              } else {
                self.replace(result.location || result)
              }
            } else {
              warning(false, `Invalid result returned from beforeEnter() in route '${route.path}'. Return true to indicate the transition should continue.`)
              locked = false
              callback(true)
            }
          }
        }),

        _onHistoryUpdate(location, action) {
          warning(locked, 'A history update has occurred while the router was locked. You should not update the underlying history manually.')
          const prevRoute = self.currentRoute
          let prevController
          if (prevRoute) {
            prevController = self.controllerTree
          }

          self.location = getLocation(location)
          self.action = action
          const branch = getMatch(location.pathname)
          if (branch) {
            const { route, match } = branch
            self.currentRoute = route
            self.match = match

            const newController = self.controllerTree
            if (newController && newController === prevController) {
              getLeaves(newController).forEach(wrap(leaf => leaf.onUpdate && leaf.onUpdate()))
              return
            }

            if (prevController) {
              getLeaves(prevController).forEach(wrap(leaf => leaf.onLeave && leaf.onLeave()))
            }

            if (newController) {
              getLeaves(newController).forEach(wrap(leaf => leaf.onEnter && leaf.onEnter()))
            }
          } else if (prevController) {
            self.match = null
            getLeaves(prevController).forEach(wrap(leaf => leaf.onLeave && leaf.onLeave()))
          }
        }
      }
    }
  })
