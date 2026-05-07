import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/connect',
    },
    {
      path: '/connect',
      name: 'connect',
      component: () => import('@/views/ConnectView.vue'),
    },
    {
      path: '/import',
      name: 'import',
      component: () => import('@/views/ImportView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/wizard',
      name: 'wizard',
      component: () => import('@/views/ImportWizardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/schueler',
      name: 'schueler',
      component: () => import('@/views/SchuelerView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/lehrer',
      name: 'lehrer',
      component: () => import('@/views/LehrerView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isConnected) {
    return { name: 'connect' }
  }
})

export default router
