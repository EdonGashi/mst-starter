import { fromLocation, toLocation, toPath, getProps } from './utils'
import warning from 'utils/warning'
import { observable, computed, set } from 'mobx'
import { resolveDependencies, tracked } from 'app'
import { stringify } from 'utils/error'

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

  @tracked(false) async _beforeUpdate(location, action, callback, forceShallow = false) {
    if (this._locked) {
      return callback(false)
    }

    this._locked = true
    const origCallback = callback
    callback = (decision, willRedirect = false) => {
      this._locked = false
      origCallback(decision, willRedirect)
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
      location: fromLocation(location),
      match,
      shallow: forceShallow || route === this._currentRoute,
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

      callback(false, true)
      if (action === 'PUSH') {
        this.push(result)
      } else {
        this.replace(result)
      }
    }

    callback(true)
  }

  @tracked(false) async _onUpdate(location, action, forceShallow = false, forceError = null) {
    const next = this._routes.match(location.pathname)
    if (!next) {
      this.routeProps = null
      return
    }

    const oldProps = this.routeProps
    const app = this._app
    const { route, match } = next
    const shallow = forceShallow || route === this._currentRoute
    const routeParam = {
      action: action,
      location: fromLocation(location),
      match,
      shallow,
      route
    }

    const propsParam = { app, route: routeParam }
    const baseProps = getProps(propsParam, this._routes.props)
    const routeProps = getProps(propsParam, route.props)
    const props = {
      shouldUpdate: !shallow,
      ...baseProps,
      ...routeProps,
      route: routeParam,
      router: this,
      app,
      onBefore: null,
      onAfter: null,
      error: forceError,
      loading: false
    }

    if (process.env.IS_SERVER) {
      const component = route.component
      if (component.dependencies && typeof component.dependencies === 'object') {
        resolveDependencies(app, component.dependencies)
      }

      const func = shallow ? component.onShallowEnter : component.onEnter
      if (typeof func === 'function') {
        try {
          await func.call(null, props, app)
        } catch (err) {
          props.error = err
          console.error(err)
        } finally {
          props.loading = false
        }
      }
    } else {
      try {
        route.component.preloadWeak()
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error(err)
        }
      }

      const isSync = 'dependencies' in route.component
      if (isSync) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Sync loading...', props)
        }

        const component = route.component
        if (component.dependencies && typeof component.dependencies === 'object') {
          resolveDependencies(app, component.dependencies)
        }

        const func = shallow ? component.onShallowEnter : component.onEnter
        if (typeof func === 'function') {
          let promise
          try {
            promise = func.call(null, props, app)
          } catch (err) {
            props.error = err
          }

          if (promise && promise.then) {
            promise.then(
              () => {
                if (this.routeProps === props && props.loading) {
                  this.routeProps = {
                    ...props,
                    loading: false
                  }
                }
              },
              err => {
                if (this.routeProps === props) {
                  this.routeProps = {
                    ...props,
                    error: err,
                    loading: false
                  }
                }
              })
          } else {
            props.loading = false
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
              console.log('Async loading...', props)
            }

            const newProps = { ...props }
            if (component.dependencies && typeof component.dependencies === 'object') {
              resolveDependencies(app, component.dependencies)
            }

            let rerender = false
            const func = shallow ? component.onShallowEnter : component.onEnter
            if (typeof func === 'function') {
              try {
                await func.call(null, newProps, app)
                newProps.loading = false
                rerender = this.routeProps === props && props.loading
              } catch (err) {
                newProps.loading = false
                newProps.error = err
                rerender = this.routeProps === props
              }
            }

            if (rerender) {
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
    this._initialError = snapshot && snapshot.error
    this._prefetchCache = {}
    this._app = app
    this._routes = routes

    let nextLocation = null
    let nextAction = null
    const history = createHistory({
      ...getProps(app, historyProps, false),
      getUserConfirmation: (message, callback) =>
        this._beforeUpdate(nextLocation, nextAction, callback)
    })

    this._history = history
    this._unblock = history.block((location, action) => {
      nextLocation = location
      nextAction = action
      return 'Cannot perform this action.'
    })

    this._unlisten = history.listen((location, action) => this._onUpdate(location, action))
  }

  @computed get route() {
    if (!this.routeProps) {
      return null
    }

    return this.routeProps.route
  }

  @computed get currentError() {
    if (!this.routeProps) {
      return null
    }

    return this.routeProps.error
  }

  @tracked(false) refresh(action = 'REPLACE', forceShallow = false, forceError = null) {
    const location = { ...this._history.location }
    return new Promise((resolve, reject) => {
      this._beforeUpdate(location, action, (decision, willRedirect) => {
        if (!decision) {
          if (process.env.IS_SERVER && !willRedirect) {
            this._app.__volatile.__forbidden()
          }

          return resolve()
        }

        this._onUpdate(location, action, forceShallow, forceError).then(resolve, reject)
      }, forceShallow)
    })
  }

  createHref(path) {
    return this._history.createHref(toLocation(path, this._history.location))
  }

  push(path) {
    if (process.env.IS_SERVER) {
      return this._app.__volatile.__redirect(toLocation(path, this._history.location))
    }

    this._history.push(toLocation(path, this._history.location))
  }

  replace(path) {
    if (process.env.IS_SERVER) {
      return this._app.__volatile.__redirect(toLocation(path, this._history.location))
    }

    this._history.replace(toLocation(path, this._history.location))
  }

  prefetch(path) {
    if (process.env.IS_SERVER) {
      return
    }

    path = toPath(path, this._history.location)
    if (!path) {
      return
    }

    if (path in this._prefetchCache) {
      return
    }

    const match = this._routes.match(path)
    if (match) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Prefetching '${path}'...`)
      }

      this._prefetchCache[path] = true
      match.route.component.preload()
    }
  }

  go(n) {
    if (process.env.IS_SERVER) {
      throw new Error('Cannot perform this action server-side.')
    }

    this._history.go(n)
  }

  goBack() {
    if (process.env.IS_SERVER) {
      throw new Error('Cannot perform this action server-side.')
    }

    this._history.goBack()
  }

  goForward() {
    if (process.env.IS_SERVER) {
      throw new Error('Cannot perform this action server-side.')
    }

    this._history.goForward()
  }

  onDomError(error) {
    if (!this.routeProps) {
      return
    }

    this.routeProps = {
      ...this.routeProps,
      error
    }
  }

  toJSON(flag) {
    if (process.env.NODE_ENV === 'development' && flag === 'hot') {
      this._unblock()
      this._unlisten()
    }

    if (process.env.IS_SERVER) {
      if (process.env.NODE_ENV === 'development') {
        return {
          error: stringify(this.currentError)
        }
      }

      return {
        error: !!this.currentError
      }
    }

    return {
      error: stringify(this.currentError)
    }
  }
}
