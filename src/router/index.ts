import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import {useAuthStore} from "@/stores/auth.ts";

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: () => {
            const last = localStorage.getItem('marmotte.route')
            const known = ['planning', 'inventaire', 'courses', 'notes', 'travaux', 'architecture']
            return last && known.includes(last) ? `/${last}` : '/planning'
        },
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('@/views/LoginView.vue'),
        meta: {bare: true},
    },
    {
        path: '/planning',
        name: 'planning',
        component: () => import('@/views/PlanningView.vue'),
        meta: {requireAuth: true}
    },
    {
        path: '/inventaire',
        name: 'inventaire',
        component: () => import('@/views/InventoryView.vue'),
        meta: {requireAuth: true}
    },
    {
        path: '/courses',
        name: 'courses',
        component: () => import('@/views/CoursesView.vue'),
        meta: {requireAuth: true}
    },
    {
        path: '/notes',
        name: 'notes',
        component: () => import('@/views/NotesView.vue'),
        meta: {requireAuth: true}
    },
    {
        path: '/travaux',
        name: 'travaux',
        component: () => import('@/views/WorkView.vue'),
        meta: {requireAuth: true}
    },
    {
        path: '/architecture',
        name: 'architecture',
        component: () => import('@/views/ArchitectureView.vue'),
        meta: {requireAuth: true}
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to) => {
    const authStore = useAuthStore()
    if (to.meta.requireAuth && !authStore.isAuthenticated) {
        return {name: 'login'}
    }
    if (to.name === 'login' && authStore.isAuthenticated) {
        return {name: 'planning'}
    }
})

router.afterEach((to) => {
    if (to.name && to.name !== 'login') {
        localStorage.setItem('marmotte.route', String(to.name))
    }
})
export default router
