<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/shared/ui/AppButton.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'

import { useAuthStore } from '@/stores/auth'
import { env } from '@/shared/config/env'

type ContactMeta = {
    ip?: string
    userAgent?: string
}

type Contact = {
    id: string
    name: string
    email: string
    message?: string
    isRead: boolean
    meta?: ContactMeta
    createdAt?: string
    updatedAt?: string
}

type ApiResponse<T> = {
    message: string
    success: boolean
    data: T
}

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

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

    if (!res.ok) {
        const msg = json?.message || `Request failed (${res.status})`
        throw new Error(msg)
    }

    return json as ApiResponse<T>
}

function formatDate(v?: string) {
    if (!v) return '—'
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? v : d.toLocaleString()
}

// ====== state ======
const isLoading = ref(false)
const errorText = ref('')

const contact = ref<Contact | null>(null)
const id = String(route.params.id ?? '')

async function loadContact() {
    errorText.value = ''
    isLoading.value = true
    try {
        const res = await api<{ contact: Contact }>(`/api/admin/contacts/${id}`)
        contact.value = res.data.contact
    } catch (e) {
        errorText.value = e instanceof Error ? e.message : 'Load contact error'
    } finally {
        isLoading.value = false
    }
}

const updating = ref(false)

async function toggleRead() {
    if (!contact.value) return
    errorText.value = ''
    updating.value = true
    try {
        const res = await api<{ contact: Contact }>(`/api/admin/contacts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ isRead: !contact.value.isRead }),
        })
        contact.value = res.data.contact
    } catch (e) {
        errorText.value = e instanceof Error ? e.message : 'Update contact error'
    } finally {
        updating.value = false
    }
}

function back() {
    router.push({ name: 'admin-contacts' })
}

onMounted(() => void loadContact())
</script>

<template>
    <div class="admin-contact page app-wrapper">
        <div class="header card">
            <div class="header-left">
                <h2 class="title">Contact</h2>
                <span
                    v-if="contact"
                    class="badge"
                    :data-status="contact.isRead ? 'read' : 'unread'"
                >
                    {{ contact.isRead ? 'read' : 'unread' }}
                </span>
            </div>

            <div class="controls">
                <AppButton type="button" @click="back" variant="sm">Back</AppButton>

                <AppButton
                    v-if="contact"
                    type="button"
                    :disabled="updating"
                    @click="toggleRead"
                    variant="sm"
                >
                    {{ updating ? 'Updating...' : contact.isRead ? 'Mark unread' : 'Mark read' }}
                </AppButton>
            </div>
        </div>

        <p v-if="errorText" class="error">{{ errorText }}</p>

        <section class="card">
            <div v-if="isLoading" class="muted">Loading...</div>

            <div v-else-if="contact" class="content">
                <div class="grid">
                    <div class="field">
                        <div class="label">name</div>
                        <div class="value">{{ contact.name }}</div>
                    </div>

                    <div class="field">
                        <div class="label">email</div>
                        <div class="value">{{ contact.email }}</div>
                    </div>

                    <div class="field">
                        <div class="label">created</div>
                        <div class="value">{{ formatDate(contact.createdAt) }}</div>
                    </div>

                    <div class="field">
                        <div class="label">updated</div>
                        <div class="value">{{ formatDate(contact.updatedAt) }}</div>
                    </div>

                    <div class="field full">
                        <div class="label">message</div>
                        <p class="text-description contact-message">{{ contact.message ?? '' }}</p>
                    </div>

                    <div class="field full">
                        <div class="label">meta</div>
                        <div class="meta">
                            <div><b>IP:</b> {{ contact.meta?.ip || '—' }}</div>
                            <div><b>User-Agent:</b> {{ contact.meta?.userAgent || '—' }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="muted">Not found</div>
        </section>
    </div>
</template>

<style scoped>
.page {
    padding: 0 0 60px 0;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
}

.title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
}

.controls {
    display: flex;
    gap: 10px;
    align-items: center;
}

.card {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 16px 0;
    margin-bottom: 16px;
}

.error {
    margin: 8px 0 12px;
    color: #ff6b6b;
}

.muted {
    opacity: 0.7;
}

.content {
    padding-top: 4px;
}

.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.field.full {
    grid-column: 1 / -1;
}

.label {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 8px;
    text-transform: uppercase;
}

.value {
    opacity: 0.95;
}

.meta {
    display: grid;
    gap: 8px;
    word-break: break-word;
    opacity: 0.95;
}

.contact-message {
    font-size: 16px;
    word-break: break-all;
}

.badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 12px;
    border: 1px solid rgba(255, 255, 255, 0.18);
}

.badge[data-status='unread'] {
    font-weight: 700;
}

@media (max-width: 900px) {
    .page {
        padding: 20px 0;
    }

    .title {
        font-size: 24px;
    }
}

@media (max-width: 760px) {
    .header {
        flex-direction: column;
        align-items: stretch;
    }

    .controls {
        flex-wrap: wrap;
        justify-content: flex-start;
    }

    .grid {
        grid-template-columns: 1fr;
    }
}
</style>
