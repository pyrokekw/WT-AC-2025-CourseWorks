<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue'
import { useModalStore } from '@/stores/modal'
import { useAuthStore } from '@/stores/auth'
import { env } from '@/shared/config/env'

import AppButton from '@/shared/ui/AppButton.vue'
import AppInput from '@/shared/ui/AppInput.vue'
import AppError from '@/shared/ui/AppError.vue'
import AppColorPicker from '../ui/AppColorPicker.vue'

type Tag = {
    id: string
    name: string
    color: string
    createdAt?: string
    updatedAt?: string
}

type EditTagPayload = {
    tag: Tag
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

const payload = computed(() => props.payload as EditTagPayload | undefined)

const API_BASE: string = env.API_URL

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

const HEX_COLOR_REGEX = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

function normalizeHex(value: string) {
    const v = value.trim()
    if (!v) return v
    return v.startsWith('#') ? v : `#${v}`
}

const form = reactive({
    id: '',
    name: '',
    color: '',
})

const state = reactive({
    isLoading: false,
    error: '',
})

watchEffect(() => {
    const t = payload.value?.tag
    if (!t) return

    form.id = t.id
    form.name = t.name
    form.color = t.color
})

const previewColor = computed(() => {
    const c = form.color.trim()
    if (!c) return 'transparent'
    if (!HEX_COLOR_REGEX.test(c)) return 'transparent'
    return normalizeHex(c)
})

async function onSubmit() {
    state.error = ''
    state.isLoading = true

    try {
        const name = form.name.trim().toLowerCase()
        const colorRaw = form.color.trim()

        if (!name) throw new Error('name is invalid')
        if (!colorRaw) throw new Error('color is required')
        if (!HEX_COLOR_REGEX.test(colorRaw)) {
            throw new Error('color must be a valid hex like #AABBCC or #ABC')
        }

        await api<{ tag: Tag }>(`/api/admin/tags/${form.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                name,
                color: normalizeHex(colorRaw),
            }),
        })

        await payload.value?.onSaved?.()
        modal.close()
    } catch (e) {
        state.error = e instanceof Error ? e.message : 'Update tag error'
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
        <h3 class="title">Edit tag</h3>

        <form class="form" @submit.prevent="onSubmit">
            <AppInput
                v-model="form.name"
                id="edit-tag-name"
                name="name"
                autocomplete="off"
                label="Name"
                placeholder="e.g. vue"
            />

            <AppColorPicker id="edit-tag-color" v-model="form.color" label="color" />

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

.color-row {
    display: grid;
    grid-template-columns: 1fr 52px;
    gap: 12px;
    align-items: end;
}

.swatch {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.14);
}

.controls {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 8px;
}

@media (max-width: 760px) {
    .content {
        min-width: auto;
        width: 100%;
    }

    .color-row {
        grid-template-columns: 1fr;
    }

    .swatch {
        width: 100%;
        height: 42px;
        border-radius: 29px;
    }
}
</style>
