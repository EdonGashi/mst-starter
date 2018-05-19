import React from 'react'
import './About.scss'

export default class About extends React.Component {
  static onEnter(props) {
    console.log('onEnter About')
  }

  static onShallowEnter(props) {
    console.log('onShallowEnter About')
  }

  render() {
    return <div className='About'>About</div>
  }
}
