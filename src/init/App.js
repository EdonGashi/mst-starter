import React from 'react'
import universal from 'react-universal-component'
import Helmet, { HelmetProvider } from 'react-helmet-async'
import { Provider } from 'mobx-react'
import { extend, inject } from 'app-react'

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

@extend('service.myStore', MyStore)
@inject('greeter=service.myStore')
class MyComponent extends React.Component {
  render() {
    return <div>Hello from subComponent: {this.props.greeter.greeting}</div>
  }
}

class App extends React.Component {
  render() {
    return <div>
      <h1>Hello React!!!</h1>
      <Helmet>
        <title>Test!!!</title>
      </Helmet>
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
