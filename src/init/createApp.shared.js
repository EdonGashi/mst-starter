import { createAppFactory, withCookieSession, withConstruct } from 'app'

export default createAppFactory(
  withCookieSession(),
  withConstruct()
)
