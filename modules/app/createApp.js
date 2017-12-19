import { AppNode } from './tree'

export default function createApp(...initializers) {
  return function app(payload) {
    const root = new AppNode(null, payload)
    initializers.forEach(initializer => initializer(app))
    return root
  }
}
