<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/shared/ui/AppButton.vue'
import AppInput from '@/shared/ui/AppInput.vue'
import AppSelect from '@/shared/ui/AppSelect.vue'

import { useAuthStore } from '@/stores/auth'
import { env } from '@/shared/config/env'

const limitOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
] as const

const readOptions = [
    { label: 'all', value: '' },
    { label: 'unread', value: 'false' },
    { label: 'read', value: 'true' },
] as const

type Contact = {
    id: string
    name: string
    email: string
    message?: string
    isRead: boolean
    createdAt?: string
    updatedAt?: string
}

type Pagination = {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
}

type ApiResponse<T> = {
    message: string
    success: boolean
    data: T
}

const auth = useAuthStore()
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

const contacts = ref<Contact[]>([])
const pagination = reactive<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
})

const page = ref(1)
const limit = ref(10)
const search = ref('')
const isRead = ref<'' | 'true' | 'false'>('')

let searchTimer: number | null = null
function triggerSearchReload() {
    if (searchTimer) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => {
        page.value = 1
        void loadContacts()
    }, 350)
}

// ====== API actions ======
async function loadContacts() {
    errorText.value = ''
    isLoading.value = true

    try {
        const qs = new URLSearchParams()
        qs.set('page', String(page.value))
        qs.set('limit', String(limit.value))
        if (search.value.trim()) qs.set('search', search.value.trim())
        if (isRead.value === 'true' || isRead.value === 'false') qs.set('isRead', isRead.value)

        const res = await api<{
            contacts: Contact[]
            pagination: Pagination
        }>(`/api/admin/contacts?${qs.toString()}`)

        contacts.value = res.data.contacts
        Object.assign(pagination, res.data.pagination)

        // если после фильтра/апдейта попали на пустую страницу — шаг назад
        if (contacts.value.length === 0 && page.value > 1 && pagination.totalPages < page.value) {
            page.value = pagination.totalPages
        }
    } catch (e) {
        errorText.value = e instanceof Error ? e.message : 'Load contacts error'
    } finally {
        isLoading.value = false
    }
}

const updatingId = ref<string | null>(null)

async function toggleRead(c: Contact) {
    errorText.value = ''
    updatingId.value = c.id

    try {
        await api<{ contact: Contact }>(`/api/admin/contacts/${c.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ isRead: !c.isRead }),
        })

        await loadContacts()
    } catch (e) {
        errorText.value = e instanceof Error ? e.message : 'Update contact error'
    } finally {
        updatingId.value = null
    }
}

function openContact(c: Contact) {
    router.push({ name: 'admin-contact', params: { id: c.id } })
}

watch([page, limit, isRead], () => void loadContacts())
watch(search, () => triggerSearchReload())

const canPrev = computed(() => pagination.hasPrev && !isLoading.value)
const canNext = computed(() => pagination.hasNext && !isLoading.value)

onMounted(() => {
    page.value = 1
    limit.value = 10
    void loadContacts()
})
</script>

<template>
    <div class="admin-contacts page app-wrapper">
        <div class="header card">
            <h2 class="title">Contacts</h2>

            <div class="controls">
                <AppInput
                    id="contacts-search"
                    v-model="search"
                    placeholder="Search by name / email / message"
                    autocomplete="off"
                />

                <AppSelect
                    class="read"
                    id="contacts-read"
                    v-model="isRead"
                    :options="readOptions"
                    size="sm"
                />

                <AppSelect
                    class="limit"
                    id="contacts-limit"
                    v-model.number="limit"
                    :options="limitOptions"
                    size="sm"
                />
            </div>
        </div>

        <p v-if="errorText" class="error">{{ errorText }}</p>

        <section class="card">
            <div class="list-head">
                <h3 class="card-title">Contacts list</h3>

                <div class="pagination">
                    <AppButton :disabled="!canPrev" type="button" @click="page--" variant="sm">
                        Prev
                    </AppButton>

                    <span class="page-info">
                        Page {{ pagination.page }} / {{ pagination.totalPages }} · Total
                        {{ pagination.total }}
                    </span>

                    <AppButton :disabled="!canNext" type="button" @click="page++" variant="sm">
                        Next
                    </AppButton>
                </div>
            </div>

            <div v-if="isLoading" class="muted">Loading...</div>

            <div v-else class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Status</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Message</th>
                            <th>Created</th>
                            <th>Updated</th>
                            <th class="right">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-if="contacts.length === 0">
                            <td colspan="7" class="muted">No contacts</td>
                        </tr>

                        <tr v-for="c in contacts" :key="c.id" :class="{ unreadRow: !c.isRead }">
                            <td>
                                <span class="badge" :data-status="c.isRead ? 'read' : 'unread'">
                                    {{ c.isRead ? 'read' : 'unread' }}
                                </span>
                            </td>

                            <td class="click" @click="openContact(c)">{{ c.name }}</td>
                            <td class="click" @click="openContact(c)">{{ c.email }}</td>

                            <td class="msg click" @click="openContact(c)">
                                {{ c.message || '—' }}
                            </td>

                            <td>{{ formatDate(c.createdAt) }}</td>
                            <td>{{ formatDate(c.updatedAt) }}</td>

                            <td class="right">
                                <div class="row-actions">
                                    <AppButton type="button" @click="openContact(c)" variant="sm">
                                        View
                                    </AppButton>

                                    <AppButton
                                        type="button"
                                        :disabled="updatingId === c.id"
                                        @click="toggleRead(c)"
                                        variant="sm"
                                    >
                                        {{
                                            updatingId === c.id
                                                ? 'Updating...'
                                                : c.isRead
                                                  ? 'Mark unread'
                                                  : 'Mark read'
                                        }}
                                    </AppButton>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
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

.title {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
}

.controls {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
}

.controls :deep(.app-input-wrapper) {
    flex: 1;
    min-width: 0;
}

.controls .read {
    flex: 0 0 160px;
    width: 160px;
}

.controls .limit {
    flex: 0 0 140px;
    width: 140px;
}

.card {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 16px 0;
    margin-bottom: 16px;
}

.card-title {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 700;
}

.error {
    margin: 8px 0 12px;
    color: #ff6b6b;
}

.muted {
    opacity: 0.7;
}

.list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.pagination {
    display: flex;
    align-items: center;
    gap: 10px;
}

.page-info {
    font-size: 13px;
    opacity: 0.85;
}

.table-wrap {
    overflow: auto;
}

.table {
    width: 100%;
    border-collapse: collapse;
}

.table th,
.table td {
    padding: 10px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    text-align: left;
    vertical-align: middle;
}

.right {
    text-align: right;
}

.row-actions {
    display: inline-flex;
    gap: 8px;
    justify-content: flex-end;
    flex-wrap: wrap;
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

.unreadRow td {
    font-weight: 600;
}

.click {
    cursor: pointer;
}

.msg {
    max-width: 420px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
        flex-direction: column;
        align-items: stretch;
    }

    .controls .read,
    .controls .limit {
        width: 100%;
        flex-basis: auto;
    }

    .list-head {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }

    .pagination {
        flex-wrap: wrap;
        justify-content: flex-start;
    }
}

@media (max-width: 520px) {
    .table th,
    .table td {
        padding: 8px 6px;
    }

    .table th:nth-child(6),
    .table td:nth-child(6) {
        display: none;
    }
}
</style>
