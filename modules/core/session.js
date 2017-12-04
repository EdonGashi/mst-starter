import { types as t, getRoot } from 'mobx-state-tree'

const RouteState = t
  .model('RouteState', {
    key: t.identifier(t.string),
    state: t.maybe(t.frozen)
  })
  .actions(self => ({
    setState(value) {
      self.state = value
    }
  }))

const LocalState = t
  .model('LocalState', {
    _local: t.maybe(t.frozen),
    _route: t.reference(RouteState)
  })
  .views(self => {
    const root = getRoot(self)
    return {
      get local() {
        return self._local
      },
      set local(value) {
        self.setLocal(value)
      },
      get route() {
        return self._route.state
      },
      set route(value) {
        self._route.setState(value)
      },
      get app() {
        return root.app
      }
    }
  })
  .actions(self => ({
    setLocal(value) {
      self._local = value
    }
  }))

const SessionRoot = t
  .model('SessionRoot', {
    app: t.optional(t.map(t.frozen), {}),
    route: t.optional(t.map(RouteState), {}),
    current: t.maybe(LocalState)
  })
  .actions(self => {
    return {
      setCurrent(key) {
        if (!self.route.has(key)) {
          self.route.put({ key })
        }

        self.current = { _route: key }
      }
    }
  })

export default SessionRoot
