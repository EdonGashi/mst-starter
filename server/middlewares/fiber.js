import Fiber from 'fibers'

export default function fiber() {
  return function (ctx, next) {
    return new Promise(function (resolve, reject) {
      ctx.fiber = Fiber(function () {
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

      ctx.fiber.run()
    })
  }
}
