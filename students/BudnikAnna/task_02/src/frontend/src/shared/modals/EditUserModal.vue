<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue'
import { useModalStore } from '@/stores/modal'
import { useAuthStore } from '@/stores/auth'
import { env } from '@/shared/config/env'

import AppButton from '@/shared/ui/AppButton.vue'
import AppInput from '@/shared/ui/AppInput.vue'
import AppError from '@/shared/ui/AppError.vue'

type Role = 'user' | 'admin'

type User = {
    id: string
    name: string
    email: string
    role: Role
    createdAt?: string
    updatedAt?: string
}

type EditUserPayload = {
    user: User
    onSaved?: () => void | Promise<void>
}

type ApiResponse<T> = {
    message: string
    success: boolean
    data: T
}

const props = defineProps<{ payload?: unknown }>()

const modal = useModalStore()
const auth = useAuthStore()

const payload = computed(() => props.payload as EditUserPayload | undefined)

const API_BASE: string =
    ((env as any).API_URL ?? (env as any).apiUrl ?? (import.meta as any).env?.VITE_API_URL ?? '') ||
    ''

function buildUrl(path: string) {
    const base = API_BASE.replace(/\/$/, '')
    return `${base}${path}`
}

async function api<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
    const token =
        (auth as any).token ||
        (typeof (auth as any).getToken === 'function' ? (auth as any).getToken() : null) ||
        localStorage.getItem('token')

    const headers = new Headers(init.headers || {})
    headers.set('Accept', 'application/json')
    if (init.body) headers.set('Content-Type', 'application/json')
    if (token && typeof token === 'string') headers.set('Authorization', `Bearer ${token}`)

    const res = await fetch(buildUrl(path), { ...init, headers })

    const raw = await res.text()
    let json: any = null
    try {
        json = raw ? JSON.parse(raw) : null
    } catch {
        json = null
    }

    if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`)
    return json as ApiResponse<T>
}

const form = reactive({
    id: '',
    name: '',
    email: '',
    password: '', // пусто => не менять
    role: 'user' as Role,
})

const state = reactive({
    isLoading: false,
    error: '',
})

watchEffect(() => {
    const u = payload.value?.user
    if (!u) return

    form.id = u.id
    form.name = u.name
    form.email = u.email
    form.password = ''
    form.role = u.role
})

async function onSubmit() {
    state.error = ''
    state.isLoading = true

    try {
        const body: Record<string, any> = {
            name: form.name.trim(),
            email: form.email.trim(),
            role: form.role,
        }

        if (form.password.trim().length > 0) {
            body.password = form.password
        }

        await api<{ user: User }>(`/api/admin/users/${form.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        })

        await payload.value?.onSaved?.()
        modal.close()
    } catch (e) {
        state.error = e instanceof Error ? e.message : 'Update user error'
    } finally {
        state.isLoading = false
    }
}

function onCancel() {
    modal.close()
}
</script>

<template>
    <div class="content">
        <h3 class="title">Edit user</h3>

        <form class="form" @submit.prevent="onSubmit">
            <AppInput
                v-model="form.name"
                id="edit-user-name"
                name="name"
                autocomplete="name"
                label="Name"
                placeholder="Enter name"
            />

            <AppInput
                v-model="form.email"
                id="edit-user-email"
                name="email"
                autocomplete="email"
                label="Email"
                type="email"
                placeholder="Enter email"
            />

            <AppInput
                v-model="form.password"
                id="edit-user-password"
                name="password"
                autocomplete="new-password"
                label="New password (leave empty to keep)"
                type="password"
                placeholder="Enter new password"
            />

            <div class="field">
                <label class="label" for="edit-user-role">Role</label>
                <select id="edit-user-role" class="select" v-model="form.role">
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                </select>
            </div>

            <AppError>{{ state.error }}</AppError>

            <div class="controls">
                <AppButton type="submit" :disabled="state.isLoading">
                    {{ state.isLoading ? 'Saving...' : 'Save' }}
                </AppButton>
                <AppButton type="button" :disabled="state.isLoading" @click="onCancel">
                    Cancel
                </AppButton>
            </div>
        </form>
    </div>
</template>

<style scoped>
.content {
    padding-top: 24px;
    min-width: 520px;
    max-width: 640px;
}

.title {
    font-size: 24px;
    font-weight: 700;
}

.form {
    display: flex;
    flex-direction: column;
    row-gap: 18px;
    margin-top: 18px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.label {
    font-size: 12px;
    opacity: 0.8;
}

.select {
    height: 42px;
    border-radius: 10px;
    padding: 0 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: transparent;
    color: inherit;
}

.controls {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 8px;
}
</style>
