/*
* Based on ReactTraining/react-router DOM Link
* https://github.com/ReactTraining/react-router/blob/master/packages/react-router-dom/modules/Link.js
*
* MIT License
*
* Copyright (c) React Training 2016-2018
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

import React from 'react'
import PropTypes from 'prop-types'
import invariant from 'utils/invariant'
import { inject } from 'app-react'

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
}

@inject('__env.router')
export class Link extends React.Component {
  static propTypes = {
    router: PropTypes.object,
    onClick: PropTypes.func,
    target: PropTypes.string,
    replace: PropTypes.bool,
    prefetch: PropTypes.bool,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    innerRef: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
  }

  static defaultProps = {
    replace: false,
    prefetch: false
  }

  handleClick = event => {
    if (this.props.onClick) {
      this.props.onClick(event)
    }

    if (!event.defaultPrevented
      && event.button === 0
      && !this.props.target
      && !isModifiedEvent(event)) {
      event.preventDefault()
      const { router, replace, to } = this.props
      if (replace) {
        router.replace(to)
      } else {
        router.push(to)
      }
    }
  }

  render() {
    const { prefetch, replace, to, innerRef, router, ...props } = this.props // eslint-disable-line no-unused-vars
    invariant(to, 'Property \'to\' is required.')
    return <a
      {...props}
      onClick={this.handleClick}
      href={router.createHref(to)}
      ref={innerRef} />
  }

  componentDidMount() {
    if (this.props.prefetch) {
      this.props.router.prefetch(this.props.to)
    }
  }

  componentDidUpdate() {
    if (this.props.prefetch) {
      this.props.router.prefetch(this.props.to)
    }
  }
}
