import { withType } from 'app'
import Router from './Router'

export default function withRouter(routes, createHistory, historyProps) {
  return withType('router', Router, { routes, createHistory, historyProps })
}
