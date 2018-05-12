import 'regenerator-runtime/runtime'
import React from 'react'
import ReactDOM from 'react-dom'
import AppView from './components/App'
import { serialize } from 'app'

import createApp from './app'

let CurrentAppView = AppView
let currentApp = createApp(window.__STATE__)
function render() {
  window.__APP__ = currentApp
  ReactDOM.hydrate(
    <CurrentAppView />,
    document.getElementById('root')
  )
}

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./components/App.js', function () {
    CurrentAppView = require('./components/App').default
    currentApp = createApp(serialize(currentApp))
    render()
  })
  module.hot.accept('./app.js', function () {
    const createApp = require('./app.js').default
    currentApp = createApp(serialize(currentApp))
    render()
  })
}

render()
