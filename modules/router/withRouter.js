import { withType } from 'app'
import { Router } from './Router'
import { RouteCollection } from './RouteCollection'

export function withRouter(routes, createHistory, historyProps, name = 'router') {
  return withType(name, Router, { routes: new RouteCollection(routes), createHistory, historyProps })
}
