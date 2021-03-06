import { hydrate } from 'app'
import { Router } from './Router'
import { RouteCollection } from './RouteCollection'
import { getProps } from './utils'
import createBrowserHistory from 'history/createBrowserHistory'

export function withRouter(routes, name = 'router', createHistory = createBrowserHistory, historyProps = {}, controllersPath) {
  if (createHistory === 'default' || !createHistory) {
    createHistory = createBrowserHistory
  }

  const routeCollection = new RouteCollection(routes)
  return function (app) {
    historyProps = getProps(app, historyProps)
    const router = hydrate(app, name, Router, {
      routes: routeCollection,
      createHistory, historyProps,
      controllersPath
    })

    app.__env.router = router
    if (!historyProps.noInitialRefresh) {
      router.refresh('PUSH', true, router._initialError)
    }

    router._initialError = null
  }
}
