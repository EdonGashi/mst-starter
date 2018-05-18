import Cookies from 'js-cookie'
const prod = process.env.NODE_ENV === 'production'

export function getCookie(app, name) {
  return Cookies.get(name)
}

export function setCookie(app, name, value, expires) {
  Cookies.set(name, value, {
    expires,
    SameSite: 'lax',
    secure: prod
  })
}
