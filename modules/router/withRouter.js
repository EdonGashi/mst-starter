import { initialize } from 'app'
import Router from './Router'

export default function withRouter(history, routes, path = 'router') {
  return initialize(path, Router, { history, routes })
}
