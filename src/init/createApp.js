import { createAppFactory, withCookieSession, withConstruct } from 'app'
import routes from './routes'
import { withRouter } from 'router'

export default createAppFactory(
  withCookieSession(),
  withConstruct(),
  withRouter(routes)
)
