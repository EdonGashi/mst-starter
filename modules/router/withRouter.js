import { initialize } from 'app'
import Router from './Router'

export default function withRouter(history, routes) {
  return initialize('router', Router, { history, routes })
}
