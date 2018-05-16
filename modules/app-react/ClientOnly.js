import React from 'react'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import { inject } from './inject'

@inject.app()
@observer
export class ClientOnly extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    render: PropTypes.func,
    app: PropTypes.object
  }

  render() {
    if (process.env.IS_SERVER) {
      return null
    } else {
      if (this.props.app.__volatile.initialRender) {
        return null
      } else {
        return typeof this.props.render === 'function'
          ? this.props.render()
          : this.props.children
      }
    }
  }
}
