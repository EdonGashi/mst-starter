import React from 'react'
import Helmet, { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'mobx-react'
import PropTypes from 'prop-types'
import 'css/App'

export default class App extends React.Component {
  static propTypes = {
    app: PropTypes.object
  }

  render() {
    return (
      <Provider app={this.props.app}>
        <HelmetProvider context={this.props.app.__volatile.helmetContext}>
          <Helmet>
            <meta charSet='utf8' />
            <title>App</title>
          </Helmet>
          <div>TODO ROUTER</div>
        </HelmetProvider>
      </Provider>
    )
  }
}
