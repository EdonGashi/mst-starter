import React from 'react'
import universal from 'react-universal-component'
import '../css/App'

// const UniversalComponent = universal(props => import(`./${props.page}`), {
//   minDelay: 500,
//   loading: Loading,
//   error: NotFound
// })

export default class App extends React.Component {
  render() {
    return (
      <div>
        <h1>Hello React!</h1>
      </div>
    )
  }
}
