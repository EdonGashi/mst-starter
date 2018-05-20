import 'regenerator-runtime/runtime'
import React from 'react'
import ReactDOM from 'react-dom'
import { observable, extendObservable } from 'mobx'
import { Provider } from 'mobx-react'
import { serialize } from 'app'
import { HelmetProvider } from 'react-helmet-async'

import App from 'init/App'
import createApp from 'init/createApp'

let CurrentApp = App
let currentApp = createApp(window.__STATE__)
extendObservable(currentApp.__env, { initialRender: true, serverRender: true })

let root = {}
if (process.env.NODE_ENV !== 'production') {
  root = new class Root {
    @observable.ref app = null
  }()
}

function render() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Rendering app...')
  }

  root.app = currentApp
  window.__APP__ = root.app
  ReactDOM.hydrate(
    <HelmetProvider context={{}}>
      <Provider root={root}>
        <CurrentApp app={root.app} />
      </Provider>
    </HelmetProvider>,
    document.getElementById('root')
  )

  root.app.__env.initialRender = false
  root.app.__env.serverRender = false
  if (process.env.NODE_ENV === 'development') {
    console.log('App render complete...')
  }
}

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./init/App.js', function () {
    CurrentApp = require('./init/App').default
    currentApp = createApp(serialize(currentApp, 'hot'))
    render()
  })
  module.hot.accept('./init/createApp.js', function () {
    const createApp = require('./init/createApp.js').default
    currentApp = createApp(serialize(currentApp, 'hot'))
    render()
  })
}

render()
