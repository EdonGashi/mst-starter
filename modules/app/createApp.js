import AppNode from './AppNode'

export default function createApp(payload, ...initializers) {
  const app = new AppNode(null, payload)
  initializers.forEach(initializer => initializer(app))
  return app
}
