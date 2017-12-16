import { types as t, getEnv } from 'mobx-state-tree'
import { matchRoutes } from 'react-router-config'
import qs from 'querystringify'
import { decode } from 'utils/string-encoding'
import { getLeaves } from 'app/tree'

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

function mapRoutes(routes) {

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

        onHistoryUpdate(location, action) {
          const branch = matchRoutes(self.routes, location.pathname)
          const prevRoute = self.currentRoute
          let prevController
          if (prevRoute) {
            prevController = self.controllerTree
          }

          const { _s, ...query } = qs.parse(location.search || '')
          const { state, isValidState } = tryDecode(_s)
          self.location = {
            pathname: location.pathname,
            hash: location.hash,
            query,
            state,
            isValidState
          }

          self.action = action
          if (branch && branch.length) {
            const { route, match } = branch[0]
            self.previousRoute = prevRoute
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
