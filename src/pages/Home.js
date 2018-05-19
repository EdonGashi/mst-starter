import React from 'react'
import './Home.scss'

export default class Home extends React.Component {
  static onEnter(props) {
    console.log('onEnter Home')
  }

  static onShallowEnter(props) {
    console.log('onShallowEnter Home')
  }

  render() {
    return <div className='Home'>Home</div>
  }
}
