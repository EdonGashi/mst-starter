import { encode, decode } from 'utils/string-encoding'
import warning from 'utils/warning'
import { observable } from 'mobx'
import { withType } from '../initialize'
import { getCookie, setCookie } from './cookie'

export class CookieSession {
  @observable.ref _state = null

  constructor(payload, app, { name }) {
    warning(!name.includes('__'), 'Session names should not include double underscores.')
    name = encodeURIComponent(name).replace(/\./g, '__')
    this.app = app
    this._name = name
    if (process.env.IS_CLIENT && process.env.NODE_ENV === 'development' && payload) {
      this.set(payload)
      return
    }

    this.refresh()
  }

  get() {
    return this._state
  }

  set(state, expires) {
    if (typeof state !== 'object') {
      throw new Error('Invalid session state.')
    }

    if (!state) {
      state = {}
    } else {
      state = { ...state }
    }

    if (typeof expires === 'number') {
      expires = new Date(new Date() * 1 + expires * 36e+5)
    }

    const value = encode(state)
    setCookie(this.app, this._name, value, expires)
    this._state = state
  }

  refresh() {
    const str = getCookie(this.app, this._name)
    if (str) {
      try {
        this._state = decode(str)
      } catch (err) {
        warning(false, `Could not decode session string '${str}'.`)
        this.set({})
      }
    } else {
      this.set({})
    }
  }

  clear() {
    this.set({})
  }

  toJSON() {
    if (process.env.NODE_ENV === 'development') {
      return this._state
    }

    return null
  }
}

export function withCookieSession(name = 'session') {
  return withType(name, CookieSession, { name })
}
