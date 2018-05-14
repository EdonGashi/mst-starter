import { addMiddleware, isStateTreeNode, isRoot } from 'mobx-state-tree'
import { withMiddleware } from 'app'
import warning from 'utils/warning'
import invariant from 'utils/invariant'
import Fiber from 'fibers'

export function fibers(tree, app) {
  if (!isStateTreeNode(tree) || !isRoot(tree)) {
    return
  }

  if (typeof app.__volatile.__asyncFrame !== 'number') {
    app.__volatile.__asyncFrame = 0
  }

  addMiddleware(tree, function (call, next) {
    try {
      return next(call)
    } finally {
      if (call.type === 'flow_spawn') {
        const frame = ++app.__volatile.__asyncFrame
        if (frame === 1) {
          invariant(Fiber.current && Fiber.current === app.__volatile.__fiber, 'An async flow has been initiated from outside a render frame.')
          Fiber.yield()
        }
      } else if (call.type === 'flow_return' || call.type === 'flow_throw') {
        const frame = --app.__volatile.__asyncFrame
        warning(frame >= 0, 'Mismatched flow pairs. This will cause invalid states and memory leaks.')
        if (frame === 0) {
          // Calling setImmediate ensures that all middleware have flushed before resuming fiber.
          setImmediate(function () {
            if (app.__volatile.__asyncFrame === 0) {
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

export function withFibers() {
  return withMiddleware(fibers)
}
