import React from 'react'
import propTypes from 'prop-types'
import invariant from 'utils/invariant'
import { parse } from 'qs-fork'

const arrayFrom = Array.from || (obj => [].slice.call(obj))
function getFormElements(form) {
  const result = []
  if (!form) {
    return []
  }

  const elements = arrayFrom(form.elements)
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    if (!element.name || element.disabled) {
      continue
    }

    if (element.type === 'file') {
      const files = element.files
      for (let j = 0; j < files.length; j++) {
        result.push({ name: element.name, value: files[j] })
      }
    } else if (element.type === 'select-multiple' || element.type === 'select-one') {
      const opts = arrayFrom(element.options)
      for (let j = 0; j < opts.length; j++) {
        const opt = opts[j]
        opt.selected && result.push({ name: element.name, value: opt.value })
      }
    } else if (element.type === 'checkbox' || element.type === 'radio') {
      if (element.checked) {
        result.push({ name: element.name, value: element.value })
      }
    } else {
      result.push({ name: element.name, value: element.value })
    }
  }

  return result
}

export default class Form extends React.Component {
  static propTypes = {
    children: propTypes.node,
    params: propTypes.any
  }

  handleSubmit = (e) => {
    e.preventDefault()
    console.log(new )
  }

  render() {
    const { app } = this.context
    invariant(app && app.router, 'Form must be rendered inside an application context with a valid router.')
    return <form /* TODO: add href */ method='post' onSubmit={this.handleSubmit}>
      <input type='hidden' suppressHydrationWarning={true} name='__state__' />
      {this.props.children}
    </form>
  }
}
