import { createAppFactory, withCookieSession } from 'app'
import routes from 'init/routes'

export default createAppFactory(
  withCookieSession()
)
