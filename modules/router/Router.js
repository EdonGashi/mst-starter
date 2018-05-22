import { fromLocation, toLocation, toPath, getProps } from './utils'
import invariant from 'utils/invariant'
import warning from 'utils/warning'
import { observable, computed } from 'mobx'
import { resolveDependencies, tracked, hydrate } from 'app'
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

  get _currentComponent() {
    if (!this.routeProps) {
      return null
    }

    return this.routeProps.route.route.component
  }

  _hydrate(component, id) {
    const app = this._app
    if (component.dependencies && typeof component.dependencies === 'object') {
      resolveDependencies(app, component.dependencies)
    }

    if (component.controller) {
      invariant(id, 'A controller is not allowed to be declared from a route without an id.')
      const controllers = app[this._controllersPath]
      if (!controllers || !(id in controllers)) {
        let controllerType = component.controller
        let env
        if (Array.isArray(controllerType)) {
          [controllerType, env] = controllerType
        }

        return hydrate(app, [this._controllersPath, id], controllerType, env)
      } else {
        return controllers[id]
      }
    } else {
      return null
    }
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
    invariant(next, 'No route matched, you must always specify a 404 fallback route.')
    const { route, match } = next
    const current = this._currentComponent
    const param = {
      action: action,
      location: fromLocation(location),
      match,
      shallow: forceShallow || route.component === current,
      route,
      app: this._app
    }

    if (current) {
      if (typeof current.beforeLeave === 'function') {
        let result
        try {
          result = await current.beforeLeave(param, this._app)
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
    const shallow = forceShallow || route.component === this._currentComponent
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
      let status = route.status
      if (typeof status === 'function') {
        status = status(props)
      }

      if (!isNaN(status) && isFinite(status)) {
        app.__volatile.__status = status
      }

      props.controller = this._hydrate(component, route.id)
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
      let isSync = false
      if (typeof route.component.preloadWeak === 'function') {
        try {
          isSync = !!route.component.preloadWeak()
        } catch (err) {
          if (process.env.NODE_ENV === 'development') {
            console.error(err)
          }
        }
      } else {
        isSync = true
      }

      if (isSync) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Sync loading...', props)
        }

        const component = route.component
        props.controller = this._hydrate(component, route.id)
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
            newProps.controller = this._hydrate(component, route.id)
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

  constructor(snapshot, app, {
    routes,
    createHistory,
    historyProps,
    controllersPath
  }) {
    this._initialError = snapshot && snapshot.error
    this._prefetchCache = {}
    this._app = app
    this._routes = routes
    this._controllersPath = controllersPath || '_controllers'

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
