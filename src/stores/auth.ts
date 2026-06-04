import {defineStore} from 'pinia'
import {ref, computed} from 'vue'
import {authApi, type LoginPayload, type User} from '@/api/auth'

const TOKEN_STORAGE_KEY = 'auth_token'

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY))
    const user = ref<User | null>(null)

    const isAuthenticated = computed(() => !!token.value)

    async function login(payload: LoginPayload) {
        const {data} = await authApi.login(payload)
        token.value = data.token
        localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
        await fetchCurrentUser()
    }

    async function fetchCurrentUser() {
        if (!token.value) return
        const {data} = await authApi.me()
        user.value = data
    }

    function logout() {
        token.value = null
        user.value = null
        localStorage.removeItem(TOKEN_STORAGE_KEY)
    }

    return {
        token,
        user,
        isAuthenticated,
        login,
        fetchCurrentUser,
        logout,
    }
})
