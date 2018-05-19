import { createAppFactory, withCookieSession, withConstruct } from 'app'
import routes from 'pages/routes'
import { withRouter } from 'router'

export default createAppFactory(
  withCookieSession(),
  withConstruct(),
  withRouter(routes)
)
