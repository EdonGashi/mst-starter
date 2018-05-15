import React from 'react'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { tracked } from 'app'
import { inject, extend } from 'app-react'
import { isPromiseBasedObservable } from 'mobx-utils';

class TodoService {
  @tracked getTodos() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([1, 2, 3])
      }, 500)
    })
  }
}

class HomeController {
  static dependencies = {
    'service.todo': TodoService
  }

  constructor(snapshot = {}) {
    this.todos = snapshot.todos
  }

  @observable todos

  @tracked async onEnter() {
    this.todos = await this.$app.service.todo.getTodos()
  }
}

@extend('controller.home', HomeController)
@inject('controller.home')
export default class Home extends React.Component {
  constructor(props) {
    super(props)
    props.home.onEnter()
  }

  render() {
    const { todos } = this.props.home
    return <div>
      {todos ? todos.join(', ') : 'No todos yet'}
    </div>
  }
}
