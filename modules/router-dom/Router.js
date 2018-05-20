import React from 'react'
import { observer } from 'mobx-react'
import PropTypes from 'prop-types'
import { stringify } from 'utils/error'

function asError(e) {
  if (e) {
    return new Error(stringify(e))
  }

  return null
}

export class RouteView extends React.Component {
  static propTypes = {
    routeProps: PropTypes.object
  }

  shouldComponentUpdate(nextProps) {
    if (process.env.IS_SERVER) {
      return true
    }

    const { routeProps: current } = this.props
    const { routeProps: next } = nextProps
    if (!current || !next) {
      return true
    }

    if (current.loading && next.loading) {
      return false
    }

    if (!next.loading && !next.error && next.route.shallow && next.shouldUpdate === false) {
      return false
    }

    return true
  }

  render() {
    if (process.env.NODE_ENV === 'development') {
      console.log('Rendering route...')
    }

    const { routeProps } = this.props
    if (routeProps) {
      const { error, ...props } = routeProps
      return <routeProps.route.route.component {...props} error={asError(error)} />
    }

    return null
  }
}

@observer
export class Router extends React.Component {
  static propTypes = {
    router: PropTypes.object.isRequired
  }

  render() {
    return <RouteView routeProps={this.props.router.routeProps} />
  }
}
