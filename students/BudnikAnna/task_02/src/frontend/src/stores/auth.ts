import { env } from '@/shared/config/env'
import { defineStore } from 'pinia'
import { router } from '@/app/router'

type User = {
    id: string
    name: string
    email: string
    role: 'admin' | 'user'
    createdAt?: string
}

type ApiResponse<T> = {
    message: string
    success: boolean
    data: T
}

type AuthPayload = {
    token: string
    user: User
}

const TOKEN_KEY = 'token'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as User | null,
        isLoading: false,
        isReady: false,
        bootstrapPromise: null as Promise<void> | null,
    }),

    getters: {
        token: () => localStorage.getItem(TOKEN_KEY) ?? '',
        isAuth: (s) => Boolean(s.user),
        isAdmin: (s) => s.user?.role === 'admin',
    },

    actions: {
        setToken(token: string) {
            localStorage.setItem(TOKEN_KEY, token)
        },

        clearToken() {
            localStorage.removeItem(TOKEN_KEY)
        },

        async bootstrap() {
            if (this.isReady) return
            if (this.bootstrapPromise) return this.bootstrapPromise

            this.bootstrapPromise = (async () => {
                const token = this.token
                if (!token) {
                    this.user = null
                    this.isReady = true
                    return
                }

                this.isLoading = true
                try {
                    const res = await fetch(`${env.API_URL}/api/profile`, {
                        method: 'GET',
                        headers: { Authorization: `Bearer ${token}` },
                    })

                    const json = (await res.json()) as ApiResponse<{ user: User }>

                    if (!res.ok || !json.success) {
                        this.user = null
                        this.clearToken()
                        return
                    }

                    this.user = json.data.user
                } catch {
                    this.user = null
                } finally {
                    this.isLoading = false
                    this.isReady = true
                }
            })()

            try {
                await this.bootstrapPromise
            } finally {
                this.bootstrapPromise = null
            }
        },

        async login(payload: { email: string; password: string }) {
            this.isLoading = true
            try {
                const res = await fetch(`${env.API_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })

                const json = (await res.json()) as ApiResponse<AuthPayload>

                if (!res.ok || !json.success) {
                    throw new Error(json.message || 'Login error')
                }

                this.setToken(json.data.token)
                this.user = json.data.user
                this.isReady = true
            } finally {
                this.isLoading = false
            }
        },

        async register(payload: { name: string; email: string; password: string }) {
            this.isLoading = true
            try {
                const res = await fetch(`${env.API_URL}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })

                const json = (await res.json()) as ApiResponse<AuthPayload>

                if (!res.ok || !json.success) {
                    throw new Error(json.message || 'Register error')
                }

                this.setToken(json.data.token)
                this.user = json.data.user
                this.isReady = true
            } finally {
                this.isLoading = false
            }
        },

        logout() {
            this.clearToken()
            this.user = null
            this.isReady = true

            const current = router.currentRoute.value

            if (current.meta.requiresAdmin) {
                router.replace({ name: 'home' })
            }
        },
    },
})
