import React from 'react'
import propTypes from 'prop-types'
import invariant from 'utils/invariant'
import Provider from 'mobx-react'

export default class Router extends React.Component {
  static propTypes = {
    app: propTypes.shape({
      router: propTypes.object.isRequired
    }).isRequired
  }

  render() {
    const { app } = this.props
    invariant(app && app.router, 'Router components need a router context.')
    if (app.router.currentRoute) {
      return <Provider app={app}>
        <app.route.currentRoute.component />
      </Provider>
    }

    return <Provider app={app}>
      <this.props.NotFound />
    </Provider>
  }
}
