import React from 'react'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import { inject } from './inject'

@inject.app()
@observer
export class ServerOnly extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    render: PropTypes.func,
    app: PropTypes.object
  }

  render() {
    if (process.env.IS_SERVER) {
      return typeof this.props.render === 'function'
        ? this.props.render()
        : this.props.children
    } else {
      if (this.props.app.__volatile.initialRender) {
        return typeof this.props.render === 'function'
          ? this.props.render()
          : this.props.children
      } else {
        return null
      }
    }
  }
}
