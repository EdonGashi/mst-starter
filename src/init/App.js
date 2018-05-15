import React from 'react'
import Helmet, { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'mobx-react'
import PropTypes from 'prop-types'
import Home from 'pages/Home'

// import universal from 'react-universal-component'
// const UniversalComponent = universal(props => import(`./${props.page}`), {
//   minDelay: 500,
//   loading: Loading,
//   error: NotFound
// })

export default class App extends React.Component {
  static propTypes = {
    app: PropTypes.object
  }

  static childContextTypes = {
    app: PropTypes.object
  }

  getChildContext() {
    return {
      app: this.props.app
    }
  }

  render() {
    return (
      <Provider app={this.props.app}>
        <HelmetProvider context={this.props.app.__volatile.helmetContext}>
          <Helmet>
            <meta charSet='utf8' />
            <title>App</title>
          </Helmet>
          <Home />
        </HelmetProvider>
      </Provider>
    )
  }
}
