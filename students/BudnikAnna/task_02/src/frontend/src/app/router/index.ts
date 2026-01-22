import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { routes } from './routes'

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior() {
        return { top: 0 }
    },
})

router.beforeEach(async (to) => {
    const auth = useAuthStore()

    if (!auth.isReady) {
        await auth.bootstrap()
    }

    if (to.meta.requiresAdmin) {
        if (!auth.isAuth) {
            return { name: 'not-found' }
        }

        if (!auth.isAdmin) {
            return { name: 'not-found' }
        }
    }

    return true
})
