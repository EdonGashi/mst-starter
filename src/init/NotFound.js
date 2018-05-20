import React from 'react'
import PropTypes from 'prop-types'

export default class NotFound extends React.Component {
  static propTypes = {
    path: PropTypes.string
  }

  render() {
    return <div>404 - Page {this.props.path} not found</div>
  }
}
