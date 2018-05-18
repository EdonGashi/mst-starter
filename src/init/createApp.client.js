import { extendAppFactory } from 'app'
import createApp from './createApp.shared'
import routes from 'init/routes'
import { withRouter } from 'router'
import createHistory from 'history/createBrowserHistory'

export default extendAppFactory(
  createApp,
  withRouter(routes, createHistory, {}),
  app => app.router.refresh('REPLACE', true)
)
