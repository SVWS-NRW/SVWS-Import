import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ConnectView from '@/views/ConnectView.vue'
import ImportView from '@/views/ImportView.vue'
import ImportWizardView from '@/views/ImportWizardView.vue'
import SchuelerView from '@/views/SchuelerView.vue'
import LehrerView from '@/views/LehrerView.vue'

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
      component: ConnectView,
    },
    {
      path: '/import',
      name: 'import',
      component: ImportView,
      meta: { requiresAuth: true },
    },
    {
      path: '/wizard',
      name: 'wizard',
      component: ImportWizardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/schueler',
      name: 'schueler',
      component: SchuelerView,
      meta: { requiresAuth: true },
    },
    {
      path: '/lehrer',
      name: 'lehrer',
      component: LehrerView,
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
