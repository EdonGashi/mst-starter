import Fiber from 'fibers'

export default function fiber() {
  return function (ctx, next) {
    return new Promise(function (resolve, reject) {
      const currentFiber = Fiber(function () {
        const current = Fiber.current
        next()
          .then(result => {
            resolve(result)
            current.run()
          })
          .catch(error => {
            reject(error)
            current.run()
          })
        Fiber.yield()
      })

      ctx.app.__volatile.fiber = currentFiber
      currentFiber.run()
    })
  }
}
