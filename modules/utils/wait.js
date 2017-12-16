export default function wait(result, app) {
  if (result && result.then) {
    result
      .then(() => {
        app.__volatile.fiber.run()
      })
      .catch(err => {
        app.__volatile.fiber.throwInto(err)
      })

    app.__volatile.fiber.yield()
  }

  return result
}
