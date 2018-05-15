import React from 'react'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import { tracked } from 'app'
import { inject, extend } from 'app-react'
import 'css/Home'

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

  constructor(snapshot = {}, { service: { todo } }) {
    this.todos = snapshot.todos
    this.todoService = todo
  }

  @observable.ref todos

  @tracked onEnter() {
    this.todos = this.todoService.getTodos()
  }
}

@extend('controller.home', HomeController)
@inject('controller=controller.home')
@observer
export default class Home extends React.Component {
  constructor(props) {
    super(props)
    console.log('constructing')
    props.controller.onEnter()
  }

  render() {
    const todos = this.props.controller.todos.value
    console.log('render')
    return <div>
      {todos ? todos.join(', ') : 'No todos yet'}
    </div>
  }
}
