import React from 'react'
import { Link } from 'router-dom'
import './Home.scss'

export default class Home extends React.Component {
  static onEnter(props) {
    console.log('onEnter Home')
  }

  static onShallowEnter(props) {
    console.log('onShallowEnter Home')
  }

  render() {
    return <div className='Home'>
      <div>
        Home Page
      </div>
      <Link prefetch replace to='/about'>Visit About</Link>
    </div>
  }
}
