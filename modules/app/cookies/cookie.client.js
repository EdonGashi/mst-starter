import Cookies from 'js-cookie'

export function getCookie(app, name) {
  return Cookies.get(name)
}

export function setCookie(app, name, value, expires) {
  Cookies.set(name, value, {
    expires
  })
}
