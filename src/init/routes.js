export default {
  options: {
    minDelay: 500
  },
  props: {

  },
  routes: [
    {
      path: ['/', '/home'],
      view: () => import(/* webpackChunkName: 'pages/home/Home' */ '../pages/home/Home'),
      options: {},
      props: {}
    },
    {
      path: '/about',
      view: () => import(/* webpackChunkName: 'pages/about/About' */ '../pages/about/About'),
      options: {},
      props: {}
    }
  ]
}
