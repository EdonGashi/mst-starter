import { addMiddleware } from 'mobx-state-tree'
import warning from 'utils/warning'
import invariant from 'utils/invariant'
import Fiber from 'fibers'

export default function fibers(tree, app) {
  addMiddleware(tree, function (call, next) {
    try {
      return next(call)
    } finally {
      if (call.type === 'flow_spawn') {
        const frame = ++app.__volatile.asyncFrame
        if (frame === 1) {
          invariant(Fiber.current && Fiber.current === app.__volatile.fiber, 'An async flow has been initiated from outside a render frame.')
          Fiber.yield()
        }
      } else if (call.type === 'flow_return' || call.type === 'flow_throw') {
        const frame = --app.__volatile.asyncFrame
        warning(frame >= 0, 'Mismatched flow pairs. This will cause invalid states and memory leaks.')
        if (frame === 0) {
          // Calling setImmediate ensures that all middleware have flushed before resuming fiber.
          setImmediate(function () {
            if (app.__volatile.asyncFrame === 0) {
              app.__volatile.fiber.run()
            } else {
              warning(false, 'Async frame count has changed unexpectedly. Make sure to avoid untracked async flows.')
            }
          })
        }
      }
    }
  })
}
