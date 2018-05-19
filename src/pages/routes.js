export default {
  options: {
    minDelay: 500
  },
  props: {

  },
  beforeEnter({ route }) {
    console.log('Before enter', route)
  },
  routes: [
    {
      path: ['/', '/home'],
      view: () => import('./Home'),
      options: {},
      props: {}
    },
    {
      path: ['/about'],
      view: () => import('./About'),
      options: {},
      props: {}
    }
  ]
}
