<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppButton from '@/shared/ui/AppButton.vue'
import AppInput from '@/shared/ui/AppInput.vue'
import AppColorPicker from '@/shared/ui/AppColorPicker.vue'
import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modal'
import { env } from '@/shared/config/env'

type Tag = {
    id: string
    name: string
    color: string
    createdAt?: string
    updatedAt?: string
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

    if (!res.ok) throw new Error(json?.message || `Request failed (${res.status})`)
    return json as ApiResponse<T>
}

function formatDate(v?: string) {
    if (!v) return '—'
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? v : d.toLocaleString()
}

const HEX_COLOR_REGEX = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

function normalizeHex(value: string) {
    const v = value.trim()
    if (!v) return v
    return v.startsWith('#') ? v : `#${v}`
}

// ====== state ======
const isLoading = ref(false)
const errorText = ref('')

const tags = ref<Tag[]>([])
const search = ref('')

// debounce search
let searchTimer: number | null = null
function triggerSearchReload() {
    if (searchTimer) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => {}, 200)
}

async function loadTags() {
    errorText.value = ''
    isLoading.value = true
    try {
        const res = await api<{ tags: Tag[] }>(`/api/tags`)
        tags.value = res.data.tags
    } catch (e) {
        errorText.value = e instanceof Error ? e.message : 'Load tags error'
    } finally {
        isLoading.value = false
    }
}

const createForm = reactive({
    name: '',
    color: '',
})
const createError = ref('')
const createLoading = ref(false)

const createPreviewColor = computed(() => {
    const c = createForm.color.trim()
    if (!c) return 'transparent'
    if (!HEX_COLOR_REGEX.test(c)) return 'transparent'
    return normalizeHex(c)
})

async function createTag() {
    createError.value = ''
    createLoading.value = true
    try {
        const name = createForm.name.trim().toLowerCase()
        const colorRaw = createForm.color.trim()

        if (!name || !colorRaw) {
            throw new Error('name and color are required')
        }
        if (!HEX_COLOR_REGEX.test(colorRaw)) {
            throw new Error('color must be a valid hex like #AABBCC or #ABC')
        }

        await api<{ tag: Tag }>(`/api/admin/tags`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                color: normalizeHex(colorRaw),
            }),
        })

        createForm.name = ''
        createForm.color = ''
        await loadTags()
    } catch (e) {
        createError.value = e instanceof Error ? e.message : 'Create tag error'
    } finally {
        createLoading.value = false
    }
}

function openEdit(t: Tag) {
    errorText.value = ''
    modal.open('editTag', {
        tag: t,
        onSaved: () => loadTags(),
    })
}

const deletingId = ref<string | null>(null)

async function deleteTag(t: Tag) {
    errorText.value = ''

    const ok = window.confirm(`Удалить тег "${t.name}"?`)
    if (!ok) return

    deletingId.value = t.id
    try {
        await api<{ deletedTagId: string }>(`/api/admin/tags/${t.id}`, {
            method: 'DELETE',
        })
        await loadTags()
    } catch (e) {
        errorText.value = e instanceof Error ? e.message : 'Delete tag error'
    } finally {
        deletingId.value = null
    }
}

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return tags.value
    return tags.value.filter((t) => t.name.includes(q))
})

watch(search, () => triggerSearchReload())

onMounted(() => void loadTags())
</script>

<template>
    <div class="admin-tags page app-wrapper">
        <div class="header card">
            <h2 class="title">Tags</h2>

            <div class="controls">
                <AppInput
                    id="tags-search"
                    v-model="search"
                    placeholder="Search by name"
                    autocomplete="off"
                />
            </div>
        </div>

        <p v-if="errorText" class="error">{{ errorText }}</p>

        <section class="card">
            <h3 class="card-title">Create tag</h3>

            <p v-if="createError" class="error">{{ createError }}</p>

            <div class="grid">
                <AppInput
                    id="create-tag-name"
                    v-model="createForm.name"
                    placeholder="e.g. vue"
                    autocomplete="off"
                    label="name"
                />

                <AppColorPicker id="create-tag-color" v-model="createForm.color" label="color" />
            </div>

            <div class="actions">
                <AppButton :disabled="createLoading" type="button" @click="createTag">
                    {{ createLoading ? 'Creating...' : 'Create' }}
                </AppButton>
            </div>
        </section>

        <section class="card">
            <div class="list-head">
                <h3 class="card-title">Tags list</h3>
                <span class="muted">Total {{ filtered.length }}</span>
            </div>

            <div v-if="isLoading" class="muted">Loading...</div>

            <div v-else class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Color</th>
                            <th>Created</th>
                            <th>Updated</th>
                            <th class="right">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-if="filtered.length === 0">
                            <td colspan="5" class="muted">No tags</td>
                        </tr>

                        <tr v-for="t in filtered" :key="t.id">
                            <td>
                                <span class="tag-pill" :style="{ borderColor: t.color }">
                                    <span class="dot" :style="{ backgroundColor: t.color }" />
                                    {{ t.name }}
                                </span>
                            </td>

                            <td>
                                <span class="color-cell">
                                    <span class="dot" :style="{ backgroundColor: t.color }" />
                                    {{ t.color }}
                                </span>
                            </td>

                            <td>{{ formatDate(t.createdAt) }}</td>
                            <td>{{ formatDate(t.updatedAt) }}</td>

                            <td class="right">
                                <div class="row-actions">
                                    <AppButton type="button" @click="openEdit(t)" variant="sm">
                                        Edit
                                    </AppButton>

                                    <AppButton
                                        type="button"
                                        :disabled="deletingId === t.id"
                                        @click="deleteTag(t)"
                                        variant="sm"
                                    >
                                        {{ deletingId === t.id ? 'Deleting...' : 'Delete' }}
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

.tag-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.18);
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
}

.color-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

/* adaptivity */
@media (max-width: 900px) {
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

    .grid {
        grid-template-columns: 1fr;
    }

    .color-row {
        grid-template-columns: 1fr;
    }

    .swatch {
        width: 100%;
        height: 42px;
        border-radius: 29px;
    }

    .list-head {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }
}

@media (max-width: 520px) {
    .table th:nth-child(3),
    .table td:nth-child(3),
    .table th:nth-child(4),
    .table td:nth-child(4) {
        display: none;
    }
}
</style>
