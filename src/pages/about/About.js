import React from 'react'
import { Link } from 'router-dom'
import './About.scss'

export default class About extends React.Component {
  static onEnter(props) {
    console.log('onEnter About')
  }

  static onShallowEnter(props) {
    console.log('onShallowEnter About')
  }

  render() {
    return <div className='About'>
      <div>
        About Page
      </div>
      <Link to='/home'>Visit Home</Link>
    </div>
  }
}
