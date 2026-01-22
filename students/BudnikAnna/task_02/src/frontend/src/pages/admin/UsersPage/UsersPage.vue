<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import AppButton from '@/shared/ui/AppButton.vue'
import AppInput from '@/shared/ui/AppInput.vue'
import AppSelect from '@/shared/ui/AppSelect.vue'

import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modal'

import { env } from '@/shared/config/env'

const limitOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
] as const

const roleOptions = [
    { label: 'user', value: 'user' },
    { label: 'admin', value: 'admin' },
] as const

type Role = 'user' | 'admin'

type User = {
    id: string
    name: string
    email: string
    role: Role
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
const modal = useModalStore()

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

const users = ref<User[]>([])
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

// текущий админ
const myId = computed(() => auth.user?.id ?? null)
function isSelf(u: User) {
    return !!myId.value && u.id === myId.value
}

// debounce для поиска
let searchTimer: number | null = null
function triggerSearchReload() {
    if (searchTimer) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => {
        page.value = 1
        void loadUsers()
    }, 350)
}

// ====== API actions ======
async function loadUsers() {
    errorText.value = ''
    isLoading.value = true
    try {
        const qs = new URLSearchParams()
        qs.set('page', String(page.value))
        qs.set('limit', String(limit.value))
        if (search.value.trim()) qs.set('search', search.value.trim())

        const res = await api<{
            users: User[]
            pagination: Pagination
        }>(`/api/admin/users?${qs.toString()}`)

        users.value = res.data.users
        Object.assign(pagination, res.data.pagination)
    } catch (e) {
        errorText.value = e instanceof Error ? e.message : 'Load users error'
    } finally {
        isLoading.value = false
    }
}

// ====== CREATE ======
const createForm = reactive({
    name: '',
    email: '',
    password: '',
    role: 'user' as Role,
})
const createError = ref('')
const createLoading = ref(false)

async function createUser() {
    createError.value = ''
    createLoading.value = true
    try {
        const payload = {
            name: createForm.name.trim(),
            email: createForm.email.trim(),
            password: createForm.password,
            role: createForm.role,
        }

        if (!payload.name || !payload.email || !payload.password) {
            throw new Error('name, email, password are required')
        }

        await api<{ user: User }>(`/api/admin/users`, {
            method: 'POST',
            body: JSON.stringify(payload),
        })

        createForm.name = ''
        createForm.email = ''
        createForm.password = ''
        createForm.role = 'user'

        await loadUsers()
    } catch (e) {
        createError.value = e instanceof Error ? e.message : 'Create user error'
    } finally {
        createLoading.value = false
    }
}

function openEdit(u: User) {
    errorText.value = ''

    if (isSelf(u)) {
        errorText.value = 'You cannot edit yourself from the admin panel.'
        return
    }

    modal.open('editUser', {
        user: u,
        onSaved: () => loadUsers(),
    })
}

const deletingId = ref<string | null>(null)

async function deleteUser(u: User) {
    errorText.value = ''

    if (isSelf(u)) {
        errorText.value = 'You cannot delete yourself.'
        return
    }

    const ok = window.confirm(`Delete user "${u.name}"?`)
    if (!ok) return

    deletingId.value = u.id
    try {
        await api<{ deletedUserId: string }>(`/api/admin/users/${u.id}`, {
            method: 'DELETE',
        })

        if (users.value.length === 1 && page.value > 1) {
            page.value -= 1
        }
        await loadUsers()
    } catch (e) {
        errorText.value = e instanceof Error ? e.message : 'Delete user error'
    } finally {
        deletingId.value = null
    }
}

watch([page, limit], () => void loadUsers())
watch(search, () => triggerSearchReload())

const canPrev = computed(() => pagination.hasPrev && !isLoading.value)
const canNext = computed(() => pagination.hasNext && !isLoading.value)

onMounted(() => {
    page.value = 1
    limit.value = 10
    void loadUsers()
})
</script>

<template>
    <div class="admin-users page app-wrapper">
        <div class="header card">
            <h2 class="title">Users</h2>

            <div class="controls">
                <AppInput
                    id="users-search"
                    v-model="search"
                    placeholder="Search by name or email"
                    autocomplete="off"
                />
                <AppSelect
                    class="limit"
                    id="users-limit"
                    v-model.number="limit"
                    :options="limitOptions"
                    size="sm"
                />
            </div>
        </div>

        <p v-if="errorText" class="error">{{ errorText }}</p>

        <!-- CREATE -->
        <section class="card">
            <h3 class="card-title">Create user</h3>

            <p v-if="createError" class="error">{{ createError }}</p>

            <div class="grid">
                <AppInput
                    id="create-name"
                    v-model="createForm.name"
                    placeholder="Name"
                    autocomplete="name"
                    label="name"
                />
                <AppInput
                    id="create-email"
                    v-model="createForm.email"
                    placeholder="Email"
                    autocomplete="email"
                    type="email"
                    label="email"
                />
                <AppInput
                    id="create-password"
                    v-model="createForm.password"
                    placeholder="Password (min 6)"
                    autocomplete="new-password"
                    type="password"
                    label="password"
                />

                <AppSelect
                    id="create-role"
                    v-model="createForm.role"
                    label="Role"
                    :options="roleOptions"
                />
            </div>

            <div class="actions">
                <AppButton :disabled="createLoading" type="button" @click="createUser">
                    {{ createLoading ? 'Creating...' : 'Create' }}
                </AppButton>
            </div>
        </section>

        <!-- LIST -->
        <section class="card">
            <div class="list-head">
                <h3 class="card-title">Users list</h3>

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
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th>Updated</th>
                            <th class="right">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-if="users.length === 0">
                            <td colspan="6" class="muted">No users</td>
                        </tr>

                        <tr v-for="u in users" :key="u.id">
                            <td>
                                {{ u.name }}
                                <span v-if="isSelf(u)" class="me">(you)</span>
                            </td>
                            <td>{{ u.email }}</td>
                            <td>
                                <span class="badge" :data-role="u.role">{{ u.role }}</span>
                            </td>
                            <td>{{ formatDate(u.createdAt) }}</td>
                            <td>{{ formatDate(u.updatedAt) }}</td>
                            <td class="right">
                                <div class="row-actions">
                                    <AppButton
                                        type="button"
                                        :disabled="isSelf(u)"
                                        @click="openEdit(u)"
                                        variant="sm"
                                    >
                                        Edit
                                    </AppButton>

                                    <AppButton
                                        type="button"
                                        :disabled="isSelf(u) || deletingId === u.id"
                                        @click="deleteUser(u)"
                                        variant="sm"
                                    >
                                        {{ deletingId === u.id ? 'Deleting...' : 'Delete' }}
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

.label {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 8px;
}

.select {
    height: 56px;
    border-radius: 10px;
    padding: 0 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: transparent;
    color: inherit;
}

.actions {
    display: flex;
    gap: 10px;
    margin-top: 14px;
    justify-content: flex-end;
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
}

.badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 12px;
    border: 1px solid rgba(255, 255, 255, 0.18);
}

.badge[data-role='admin'] {
    font-weight: 700;
}

.me {
    margin-left: 8px;
    font-size: 12px;
    opacity: 0.7;
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

    .controls .limit {
        width: 100%;
        flex-basis: auto;
    }

    .grid {
        grid-template-columns: 1fr;
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

    .row-actions {
        flex-wrap: wrap;
        gap: 6px;
    }
}

@media (max-width: 520px) {
    .page {
        padding: 16px 0;
    }

    .table th,
    .table td {
        padding: 8px 6px;
    }

    .table th:nth-child(4),
    .table td:nth-child(4),
    .table th:nth-child(5),
    .table td:nth-child(5) {
        display: none;
    }
}
</style>
