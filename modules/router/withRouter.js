import { hydrate } from 'app'
import { Router } from './Router'
import { RouteCollection } from './RouteCollection'
import { getProps } from './utils'
import createMemoryHistory from 'history/createMemoryHistory'

export function withRouter(routes, name = 'router', createHistory = createMemoryHistory, historyProps = {}) {
  if (createHistory === 'default' || !createHistory) {
    createHistory = createMemoryHistory
  }

  const routeCollection = new RouteCollection(routes)
  return function (app) {
    const newHistoryProps = getProps(app, historyProps)
    if (createHistory === createMemoryHistory && !newHistoryProps.initialEntries) {
      newHistoryProps.initialEntries = [app.__volatile.__ctx.url]
    }

    const router = hydrate(app, name, Router, { routes: routeCollection, createHistory, historyProps: newHistoryProps })
    if (!newHistoryProps.noInitialRefresh) {
      router.refresh('PUSH', false, router._initialError)
    }

    router._initialError = null
  }
}
