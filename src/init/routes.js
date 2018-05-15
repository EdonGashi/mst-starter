export default {
  options: {

  },
  routes: [
    {
      path: ['/', '/home'],
      view: () => import('pages/Home')
    }
  ]
}
