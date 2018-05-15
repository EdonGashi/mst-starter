import { createAppFactory, withState, withVolatile } from 'app'
import routes from 'init/routes'

export default createAppFactory(
  withVolatile({ helmetContext: {} })
)
