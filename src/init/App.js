import React from 'react'
import PropTypes from 'prop-types'
import { Head, ServerOnly, ClientOnly, Render } from 'app-react'
import 'css/App'

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
        <ServerOnly>SERVER</ServerOnly>
        <ClientOnly>CLIENT</ClientOnly>
        <div>{JSON.stringify(this.props.app.session.get())}</div>
        <Render>
          {ctx => {
            if (ctx.serverRender) {
              return <div>SERVER RENDER</div>
            } else {
              return <div>CLIENT RENDER</div>
            }
          }}
        </Render>
      </div>
    )
  }
}
