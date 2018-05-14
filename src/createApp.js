import { createAppFactory, withState, withVolatile } from 'app'

export default createAppFactory(
  withState({ title: 'MST Starter' }),
  withVolatile({ helmetContext: {} })
)
