import React from 'react'
import { inject } from './inject'
import { resolve } from 'app/tree'
import hoistNonReactStatics from 'hoist-non-react-statics'

function extendMany(dependencies, env) {
  return function (BaseComponent) {
    const name = BaseComponent.displayName
      || BaseComponent.name
      || BaseComponent.constructor && BaseComponent.constructor.name
      || 'Unknown'

    @inject.app()
    class ExtendedComponent extends React.Component {
      static displayName = `extend(${name})`

      constructor(props) {
        super(props)
        resolve(props.app, dependencies, env)
      }

      render() {
        return <BaseComponent {...this.props} />
      }
    }

    hoistNonReactStatics(ExtendedComponent, BaseComponent)
    return ExtendedComponent
  }
}

export function extend(path, type, env = {}) {
  if (typeof path === 'object') {
    return extendMany(path, type)
  }

  return extendMany({
    [path]: type
  }, env)
}
