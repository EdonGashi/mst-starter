import NotFound from './NotFound'

export default {
  options: {
    minDelay: 500
  },
  status: ({ error }) => error && 500,
  routes: [
    {
      path: ['/', '/home'],
      view: () => import(/* webpackChunkName: 'pages/home/Home' */ '../pages/home/Home'),
    },
    {
      path: '/about',
      view: () => import(/* webpackChunkName: 'pages/about/About' */ '../pages/about/About'),
    },
    {
      path: '/',
      exact: false,
      status: 404,
      view: [NotFound],
      props: ({ route }) => ({ path: route.location.path, shouldUpdate: true })
    }
  ]
}
