import { types as t, getEnv } from 'mobx-state-tree'
import { matchRoutes } from 'react-router-config'
import qs from 'querystringify'
import wait from 'utils/wait'
import { decode } from 'utils/string-encoding'

function tryDecode(s) {
  if (typeof s === 'string' && s.length > 0) {
    try {
      return { state: decode(s), validState: true }
    } catch {
      return { state: null, validState: false }
    }
  } else {
    return { state: null, validState: true }
  }
}

const Location = t
  .model('Location', {
    pathname: t.string,
    hash: t.string,
    query: t.frozen,
    state: t.frozen,
    validState: t.boolean
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
    match: t.maybe(Match)
  })
  .volatile(self => {
    return {
      history: null,
      routes: [],
      currentRoute: null,
      previousRoute: null
    }
  })
  .extend(self => {
    const { app, env } = getEnv(self)
    let unlisten

    return {
      views: {
        get controller() {
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
          const { history, routes } = env
          self.history = history
          self.routes = routes
          unlisten = history.listen(self.onHistoryUpdate)
        },

        beforeDestroy() {
          unlisten && unlisten()
        },

        push(location) {

        },

        replace(location) {

        },

        onHistoryUpdate() {
          const { location } = self.history
          const branch = matchRoutes(self.routes, location.pathname)
          const prevRoute = self.currentRoute
          let prevController
          if (prevRoute) {
            prevController = self.controller
          }

          const { _s, ...query } = qs.parse(location.search || '')
          const { state, validState } = tryDecode(_s)
          self.location = {
            pathname: location.pathname,
            hash: location.hash,
            query,
            state,
            validState
          }

          if (branch && branch.length) {
            const { route, match } = branch[0]
            self.previousRoute = prevRoute
            self.currentRoute = route
            self.match = match

            const newController = self.controller
            if (newController && newController === prevController) {
              if (newController.onUpdate) {
                return wait(newController.onUpdate(), app)
              }

              return
            }

            if (prevController) {
              prevController.onLeave && prevController.onLeave()
            }

            if (newController && newController.onEnter) {
              return wait(newController.onEnter(), app)
            }
          } else if (prevController) {
            self.match = null
            prevController.onLeave && prevController.onLeave()
          }
        }
      }
    }
  })
