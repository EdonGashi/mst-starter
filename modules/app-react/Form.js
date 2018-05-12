import React from 'react'
import propTypes from 'prop-types'
import invariant from 'utils/invariant'
import warning from 'utils/warning'
import { parse } from 'qs-fork'
import { serialize } from 'app'
import { encode } from 'utils/string-encoding'
import makeClass from 'utils/makeClass'

const arrayFrom = Array.from || (obj => [].slice.call(obj))
function getFormElements(form) {
  if (!form) {
    return {}
  }

  const result = []
  const elements = arrayFrom(form.elements)
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i]
    if (!element.name
      || element.disabled
      || element.name === '__STATE__'
      || element.name === '__PARAM__'
      || element.name.indexOf('__ACTION__') === 0) {
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

  return parse(result)
}

function dispatch(app, action) {

}

export class Action extends React.Component {
  static propTypes = {
    name: propTypes.string.isRequired,
    className: propTypes.string,
    style: propTypes.object,
    children: propTypes.node
  }

  handleClick = (e) => {
    e.preventDefault()
    const { __universalForm } = this.context
    invariant(__universalForm, 'Action element must be in scope of a form.')
    __universalForm.dispatch(this.props.name)
  }

  render() {
    const {
      name,
      children,
      className,
      style,
      type,
      value,
      onClick,
      ...props } = this.props
    warning(type || value || onClick, '\'type\', \'value\' and \'onClick\' props are ignored in Action elements.')
    if (typeof children === 'string') {
      return <input
        {...props}
        type='submit'
        name={'__ACTION__' + name}
        value={children}
        className={makeClass('Action', className)}
        style={style}
        onClick={this.handleClick} />
    } else {
      return <button
        {...props}
        type='submit'
        name={'__ACTION__' + name}
        className={makeClass('Action', className)}
        style={style}
        onClick={this.handleClick}>
        {children}
      </button>
    }
  }
}

export class UniversalForm extends React.Component {
  static propTypes = {
    children: propTypes.node,
    param: propTypes.any
  }

  handleSubmit = (e) => {
    e.preventDefault()
  }

  render() {
    const { app } = this.context
    invariant(app && app.router, 'Form must be rendered inside an application context with a valid router.')
    const { param } = this.props
    return <form /* TODO: add href */ method='post' onSubmit={this.handleSubmit}>
      <input
        type='hidden'
        suppressHydrationWarning={true}
        name='__STATE__'
        value={process.env.SERVER
          ? encode(serialize(app))
          : ''} />
      <input
        type='hidden'
        suppressHydrationWarning={true}
        name='__PARAM__'
        value={process.env.SERVER && typeof param !== 'undefined'
          ? encode(serialize(param))
          : ''} />
      {this.props.children}
    </form>
  }
}
