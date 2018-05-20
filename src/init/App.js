import React from 'react'
import PropTypes from 'prop-types'
import { Router } from 'router-dom'
import 'css/App'

export default class App extends React.Component {
  static propTypes = {
    app: PropTypes.object
  }

  render() {
    return <Router router={this.props.app.router} />
  }
}
