import React from 'react'
import PropTypes from 'prop-types'
import { Head, ServerOnly, ClientOnly, Render } from 'app-react'
import 'css/App'
import { Observer } from 'mobx-react'

export default class App extends React.Component {
  static propTypes = {
    app: PropTypes.object
  }

  render() {
    return (
      <div>
        <Head>
          <meta charSet='utf8' />
          <title>App</title>
        </Head>
        <div>{JSON.stringify(this.props.app.session.get())}</div>
        <Observer>
          {() => {
            console.log('Router rendering...')
            const routeProps = this.props.app.router.routeProps
            if (!routeProps) {
              return null
            }

            return <routeProps.route.route.component {...routeProps} />
          }}
        </Observer>
      </div>
    )
  }
}
