import { types as t, getEnv, flow } from 'mobx-state-tree'
import { matchRoutes } from 'react-router-config'
import qs from 'querystringify'
import { decode } from 'utils/string-encoding'
import { getLeaves } from 'app/tree'
import warning from 'utils/warning'
import memoize from 'utils/memoize'

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
      const { _s, ...query } = qs.parse(location.search || '')
      const { state, isValidState } = tryDecode(_s)
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

        push(location) {

        },

        replace(location) {

        },

        _beforeHistoryUpdate: flow(function* () {
          const location = confirmLocation
          const action = confirmAction
          const callback = confirmCallback
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
              result = route.beforeEnter(param)
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
                callback(false)
                locked = false
              }
            } else if (result && typeof result === 'object' || typeof result === 'string') {
              callback(false)
              locked = false
              if (result.action === 'push' || result.action === 'PUSH') {
                self.push(result)
              } else {
                self.replace(result)
              }
            } else {
              warning(false, `Invalid result returned from beforeEnter() in route '${route.path}'.`)
              locked = false
              callback(true)
            }
          }
        }),

        _onHistoryUpdate(location, action) {
          warning(locked, 'A history update has occurred while the router is locked. You should not update the underlying history manually.')
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
              getLeaves(newController).forEach(leaf => leaf.onUpdate && leaf.onUpdate())
              return
            }

            if (prevController) {
              getLeaves(prevController).forEach(leaf => leaf.onLeave && leaf.onLeave())
            }

            if (newController) {
              getLeaves(newController).forEach(leaf => leaf.onEnter && leaf.onEnter())
            }
          } else if (prevController) {
            self.match = null
            getLeaves(prevController).forEach(leaf => leaf.onLeave && leaf.onLeave())
          }
        }
      }
    }
  })
