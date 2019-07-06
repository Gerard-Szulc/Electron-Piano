import Vue from 'vue'
import Router from 'vue-router'
import LandingPage from '../components/Piano'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'landing-page',
      component: LandingPage
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})
