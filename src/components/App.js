import React from 'react'
import universal from 'react-universal-component'
import { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'mobx-react'
import '../css/App'
import { extend, inject } from 'app-react'
import PropTypes from 'prop-types'

// const UniversalComponent = universal(props => import(`./${props.page}`), {
//   minDelay: 500,
//   loading: Loading,
//   error: NotFound
// })

class MyStore {
  static create() {
    return new MyStore()
  }

  hello() {
    console.log('Hello')
  }

  get greeting() {
    return 'hello'
  }

  toJSON() {
    return {}
  }
}

@inject('service.myStore')
class MyComponent extends React.Component {
  render() {
    return <div>Hello from subComponent: {this.props.myStore.greeting}</div>
  }
}

@extend('service.myStore', MyStore)
class App extends React.Component {
  render() {
    return <div>
      <h1>Hello React!!!</h1>
      <MyComponent />
    </div>
  }
}

export default class AppRoot extends React.Component {
  render() {
    return (
      <Provider app={this.props.app}>
        <HelmetProvider context={this.props.app.__volatile.helmetContext}>
          <App />
        </HelmetProvider>
      </Provider>
    )
  }
}
