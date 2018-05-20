import React from 'react'
import { inject } from './inject'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'

@inject.app()
@observer
export class Render extends React.Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
    render: PropTypes.func,
    app: PropTypes.object,
    observer: PropTypes.bool
  }

  render() {
    const { children, render, app } = this.props
    const renderer = children || render
    if (typeof renderer !== 'function') {
      return null
    }

    let context
    if (process.env.IS_SERVER) {
      context = {
        isServer: true,
        isClient: false,
        serverRender: true,
        initialRender: false,
        app
      }
    } else {
      const initialRender = !!app.__env.initialRender
      context = {
        isServer: false,
        isClient: true,
        serverRender: initialRender,
        initialRender: initialRender,
        app
      }
    }

    return renderer(context, app)
  }
}
