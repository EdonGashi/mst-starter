import React from 'react'
import { inject } from 'mobx-react'
import { hydrate } from 'app/tree'
import hoistNonReactStatics from 'hoist-non-react-statics'
import invariant from 'utils/invariant'

function extendMany(extensions, env = {}) {
  return function (BaseComponent) {
    const name = BaseComponent.displayName
      || BaseComponent.name
      || BaseComponent.constructor && BaseComponent.constructor.name
      || 'Unknown'

    @inject('app')
    class ExtendedComponent extends React.Component {
      static displayName = `extend(${name})`

      constructor(props) {
        super(props)
        const { app } = props
        invariant(app, 'App root not found in context. Make sure to add a context provider.')
        const len = extensions.length
        for (let i = 0; i < len; i++) {
          const { path, type, env: childEnv } = extensions[i]
          let mergedEnv = env
          if (childEnv) {
            mergedEnv = { ...env, ...childEnv }
          }

          hydrate(app, path, type, mergedEnv)
        }
      }

      render() {
        return <BaseComponent {...this.props} />
      }
    }

    hoistNonReactStatics(ExtendedComponent, BaseComponent)
    return ExtendedComponent
  }
}

export function extend(path, type, env) {
  return extendMany([{ path, type, env }])
}

extend.many = extendMany
