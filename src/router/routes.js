
const routes = [
  {
    path: '/prototype',
    component: () => import('pages/Prototype.vue'),
  },

  {
    path: '/host',
    component: () => import('pages/Host.vue'),
  },

  {
    path: '/client',
    component: () => import('pages/Client.vue'),
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Error404.vue'),
  },
]

export default routes
