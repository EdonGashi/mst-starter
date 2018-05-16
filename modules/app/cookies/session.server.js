import { encode, decode } from 'utils/string-encoding'
import warning from 'utils/warning'
import { observable } from 'mobx'
import { withType } from '../initialize'

export class Session {
  @observable.ref _state = null

  constructor(payload, app, { name }) {
    warning(!name.includes('__', 'Session names should not include double underscores.'))
    name = encodeURIComponent(name).replace(/\./g, '__')
    this.app = app
    this._name = name
    const str = app.__volatile.__ctx.cookies.get(name)
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
    this.app.__volatile.__ctx.cookies.set(this._name, value, {
      httpOnly: false,
      overwrite: true,
      expires
    })

    this._state = state
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
  return withType(name, Session, { name })
}
