// import '../src/core/init'
import Koa from 'koa'
// import bodyParser from 'koa-better-body'
// import favicon from 'koa-favicon'
// import convert from 'koa-convert'
// import config from './config'
// import context from './middleware/internal/context'
import render from './render'
// import api from './api'
// import fs from 'fs'
// import path from 'path'

const app = new Koa()

// Middleware
// app.use(favicon(config.http.favicon))
// app.use(convert(bodyParser({
//   formLimit: '1mb',
//   jsonLimit: '1mb',
//   bufferLimit: '16mb',
//   uploadDir: path.join(__dirname, '../blobs'),
//   keepExtensions: true,
//   files: true
// })))

app.use(context)

// Routes
// app.use(api.routes())
app.use(render)

app.listen(80, function () {
  console.info('Listening on port ' + 80)
})
