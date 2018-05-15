import 'regenerator-runtime/runtime'
import React from 'react'
import ReactDOM from 'react-dom'
import { serialize } from 'app'
import App from 'init/App'
import createApp from 'init/createApp'

let CurrentView = App
let currentApp = createApp(window.__STATE__)
function render() {
  window.__APP__ = currentApp
  ReactDOM.hydrate(
    <CurrentView app={currentApp} />,
    document.getElementById('root')
  )
}

if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('init/App.js', function () {
    CurrentView = require('init/App').default
    currentApp = createApp(serialize(currentApp))
    render()
  })
  module.hot.accept('init/createApp.js', function () {
    const createApp = require('init/createApp.js').default
    currentApp = createApp(serialize(currentApp))
    render()
  })
}

render()
