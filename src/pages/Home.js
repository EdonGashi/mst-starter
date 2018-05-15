import React from 'react'
import { inject } from 'app-react'

class TodoService {
  static create() {
    return new TodoService()
  }

  getTodos() {

  }
}

class HomeController {
  static create() {
    return new HomeController()
  }
}

export default class Home extends React.Component {
  render() {
    return <div>
      TODOS

    </div>
  }
}
