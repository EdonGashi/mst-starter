import Fiber from 'fibers'

export default function fiber() {
  return function (ctx, next) {
    return new Promise(function (resolve, reject) {
      const currentFiber = Fiber(function () {
        const current = Fiber.current
        next()
          .then(result => {
            current.run()
            resolve(result)
          })
          .catch(error => {
            current.run()
            reject(error)
          })
        Fiber.yield()
      })

      ctx.app.__volatile.__fiber = currentFiber
      currentFiber.run()
    })
  }
}
