import Fiber from 'fibers'
import { flow as mobxFlow } from 'mobx'
import warning from 'utils/warning'
import invariant from 'utils/invariant'

export const flow = wrapFlow(mobxFlow)

export function wrapFlow(innerFlow) {
  return function flowWrapper(...flowArgs) {
    const flowInstance = innerFlow(...flowArgs)
    return function (...methodArgs) {
      const app = this.$app
      if (app && typeof app.__volatile.__asyncFrame !== 'number') {
        app.__volatile.__asyncFrame = 0
      }

      return new Promise(function (resolve, reject) {
        let promise
        try {
          promise = flowInstance.apply(this, methodArgs)
        } catch (err) {
          return reject(err)
        }

        if (!promise || !promise.then) {
          return resolve(promise)
        }

        if (!app) {
          const fiber = Fiber.current
          if (fiber) {
            promise
              .then(result => {
                resolve(result)
                fiber.run()
              })
              .catch(error => {
                reject(error)
                fiber.run()
              })
            Fiber.yield()
          } else {
            promise.then(resolve).catch(reject)
          }

          return
        }

        const frame = ++app.__volatile.__asyncFrame
        if (frame === 1) {
          invariant(Fiber.current && Fiber.current === app.__volatile.__fiber, 'An async flow has been initiated from outside a render frame.')
          Fiber.yield()
        }

        function onFinish() {
          const newFrame = --app.__volatile.__asyncFrame
          warning(newFrame >= 0, 'Mismatched flow pairs. This will cause invalid states and memory leaks.')
          if (newFrame === 0) {
            app.__volatile.__fiber.run()
          }
        }

        promise
          .then(result => {
            resolve(result)
            onFinish()
          })
          .catch(error => {
            reject(error)
            onFinish()
          })
      })
    }
  }
}
