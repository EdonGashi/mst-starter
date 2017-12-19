import { initialize } from 'app'
import Router from './Router'

export default function withRouter(routes, createHistory, historyProps) {
  return initialize('router', Router, { routes, createHistory, historyProps })
}
