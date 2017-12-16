export default function withMiddleware(...middleware) {
  return function (app) {
    if (app.__volatile.middleware) {
      app.__volatile.middleware.push(...middleware)
    } else {
      app.__volatile.middleware = [...middleware]
    }
  }
}
