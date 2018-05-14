import { withType } from 'app'

class Router {
  
}

export default function withRouter(routes, createHistory, historyProps) {
  return withType('router', Router, { routes, createHistory, historyProps })
}
