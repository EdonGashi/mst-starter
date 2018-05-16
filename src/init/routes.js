export default {
  options: {

  },
  props: {

  },
  routes: [
    {
      path: ['/', '/home'],
      view: () => import('pages/home/Home'),
      options: {},
      props: {}
    }
  ]
}
