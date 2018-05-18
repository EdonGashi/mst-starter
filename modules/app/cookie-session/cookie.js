const prod = process.env.NODE_ENV === 'production'

export function getCookie(app, name) {
  return app.__volatile.__ctx.cookies.get(name)
}

export function setCookie(app, name, value, expires) {
  app.__volatile.__ctx.cookies.set(name, value, {
    httpOnly: false,
    overwrite: true,
    expires,
    sameSite: 'lax',
    secure: prod
  })
}
