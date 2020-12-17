
const routes = [
  {
    path: '/',
    component: () => import('pages/Prototype.vue'),
		children: [
			{ path: '', component: () => import('pages/Prototype.vue') },
			{ path: 'prototype', component: () => import('pages/Prototype.vue') }
		]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
