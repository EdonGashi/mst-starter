import { getLocation, transformLocation } from './utils'
import warning from 'utils/warning'
import { observable } from 'mobx'
import { resolve, tracked } from 'app'

function getProps(app, props) {
  if (typeof props === 'object') {
    return props
  }

  if (typeof props === 'function') {
    return props(app)
  }

  return {}
}

function once(fn) {
  let called = false
  return function () {
    if (!called) {
      called = true
      return fn.apply(null, arguments)
    }
  }
}

export class Router {
  @observable.ref routeProps = null

  get _currentRoute() {
    if (!this.routeProps) {
      return null
    }

    return this.routeProps.route.route
  }

  @tracked(false) async _beforeUpdate(location, action, callback) {
    if (this._locked) {
      return callback(false)
    }

    this._locked = true
    const origCallback = callback
    callback = (decision) => {
      this._locked = false
      origCallback(decision)
    }

    const next = this._routes.match(location.pathname)
    let route = null
    let match = null
    if (next) {
      route = next.route
      match = next.match
    }

    const current = this._currentRoute
    const param = {
      action: action,
      location: getLocation(location),
      match,
      shallow: route === this._currentRoute,
      route,
      app: this._app
    }

    if (current && current.component) {
      if (typeof current.component.beforeLeave === 'function') {
        let result
        try {
          result = await current.component.beforeLeave(param, this._app)
        } catch (err) {
          warning(false, 'A route method threw an error.')
        }

        if (result === false) {
          return callback(false)
        }
      }
    }

    if (!next) {
      return callback(true)
    }

    if (typeof route.beforeEnter === 'function') {
      let result
      try {
        result = route.beforeEnter(param, this._app)
      } catch (err) {
        warning(false, 'A route method threw an error.')
        return callback(false)
      }

      if (result === false) {
        return callback(false)
      }

      if (result === true || result === undefined) {
        return callback(true)
      }

      callback(false)
      if (action === 'PUSH') {
        this.push(result)
      } else {
        this.replace(result)
      }
    }
  }

  @tracked(false) async _onUpdate(location, action, forceShallow = false) {
    const next = this._routes.match(location.pathname)
    if (!next) {
      this.routeProps = null
      return
    }

    const oldProps = this.routeProps
    const app = this._app
    const { route, match } = next
    const routeParam = {
      action: action,
      location: getLocation(location),
      match,
      shallow: forceShallow || route === this._currentRoute,
      route
    }

    const propsParam = { app, route: routeParam }
    const baseProps = getProps(propsParam, this._routes.props)
    const routeProps = getProps(propsParam, route.props)
    const props = {
      ...baseProps,
      ...routeProps,
      route: routeParam,
      router: this,
      app,
      onBefore: null,
      onAfter: null,
      error: null,
      loading: false
    }

    if (process.env.IS_SERVER) {
      const component = route.component
      if (component.dependencies && typeof component.dependencies === 'object') {
        resolve(app, component.dependencies)
      }

      if (typeof component.onEnter === 'function') {
        try {
          await component.onEnter(props, app)
        } catch (err) {
          props.error = true
          console.error(err)
        }
      }
    } else {
      const isSync = 'dependencies' in route.component
      if (isSync) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Sync rendering...', props)
        }

        const component = route.component
        if (component.dependencies && typeof component.dependencies === 'object') {
          resolve(app, component.dependencies)
        }

        if (typeof component.onEnter === 'function') {
          let promise
          try {
            promise = component.onEnter(props, app)
          } catch (err) {
            props.error = err
          }

          if (promise && promise.then) {
            promise.catch(err => {
              if (this.routeProps === props) {
                this.routeProps = {
                  ...props,
                  error: err
                }
              }
            })
          }
        }
      } else {
        props.loading = true
        const onEnter = once((component) => {
          setTimeout(async () => {
            if (this.routeProps !== props) {
              return
            }

            if (process.env.NODE_ENV === 'development') {
              console.log('Async rendering...', props)
            }

            const newProps = { ...props }
            if (component.dependencies && typeof component.dependencies === 'object') {
              resolve(app, component.dependencies)
            }

            if (typeof component.onEnter === 'function') {
              try {
                await component.onEnter(newProps, app)
              } catch (err) {
                newProps.error = err
              } finally {
                newProps.loading = false
              }
            }

            if (this.routeProps === props) {
              this.routeProps = newProps
            }
          }, 0)
        })

        props.onAfter = function (ctx, component) {
          if (component) {
            onEnter(component)
          }
        }
      }
    }

    if (this.routeProps === oldProps) {
      this.routeProps = props
    }
  }

  constructor(snapshot, app, { routes, createHistory, historyProps }) {
    let nextLocation = null
    let nextAction = null
    const history = createHistory({
      ...getProps(app, historyProps),
      getUserConfirmation: (message, callback) =>
        this._beforeUpdate(nextLocation, nextAction, callback)
    })

    this._app = app
    this._routes = routes
    this._history = history
    this._unblock = history.block((location, action) => {
      nextLocation = location
      nextAction = action
      return 'Cannot perform this action.'
    })

    this._unlisten = history.listen((location, action) => this._onUpdate(location, action))
  }

  refresh(action = 'REPLACE', shallow = false) {
    this._onUpdate({ ...this._history.location }, action, shallow)
  }

  push(path) {
    this._history.push(transformLocation(path))
  }

  replace(path) {
    this._history.replace(transformLocation(path))
  }

  go(n) {
    this._history.go(n)
  }

  goBack() {
    this._history.goBack()
  }

  goForward() {
    this._history.goForward()
  }

  toJSON() {
    if (process.env.NODE_ENV === 'development') {
      this._unblock()
      this._unlisten()
    }

    return null
  }
}
