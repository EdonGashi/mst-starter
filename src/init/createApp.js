import { createAppFactory, withCookieSession, withConstruct } from 'app'
import routes from 'init/routes'

export default createAppFactory(
  withCookieSession(),
  withConstruct()
)
