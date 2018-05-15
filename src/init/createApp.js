import { createAppFactory, withState, withVolatile } from 'app'

export default createAppFactory(
  withVolatile({ helmetContext: {} })
)
