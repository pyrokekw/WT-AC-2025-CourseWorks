<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import AppButton from '@/shared/ui/AppButton.vue'
import AppInput from '@/shared/ui/AppInput.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'
import AppSelect from '@/shared/ui/AppSelect.vue'
import AppError from '@/shared/ui/AppError.vue'

import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modal'
import { env } from '@/shared/config/env'

type Tag = { id: string; name: string; color: string }

type ProjectLite = {
    id: string
    name: string
    imageUrl?: string
    tags?: any
    createdAt?: string
    updatedAt?: string
}

type Collection = {
    id: string
    name: string
    description: string
    cover: string
    projectsCount: number
    projects: ProjectLite[]
    createdAt?: string
    updatedAt?: string
}

type CollectionsApiData = {
    page: number
    limit: number
    total: number
    pages: number
    hasNextPage: boolean
    collections: Collection[]
}

type ProjectsApiData = {
    projects: ProjectLite[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
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

function isValidHttpUrl(value: string) {
    const v = value.trim()
    if (!v) return true
    try {
        const u = new URL(v)
        return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
        return false
    }
}

function formatDate(v?: string) {
    if (!v) return '—'
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? v : d.toLocaleString()
}

// ===== collections list =====
const isLoading = ref(false)
const errorText = ref('')

const collections = ref<Collection[]>([])

const page = ref(1)
const limit = ref(20)
const q = ref('')

const pagination = reactive({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
    hasNextPage: false,
})

const limitOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
]

let qTimer: number | null = null
function triggerCollectionsSearch() {
    if (qTimer) window.clearTimeout(qTimer)
    qTimer = window.setTimeout(() => {
        page.value = 1
        void loadCollections()
    }, 350)
}

async function loadCollections() {
    errorText.value = ''
    isLoading.value = true

    try {
        const qs = new URLSearchParams()
        qs.set('page', String(page.value))
        qs.set('limit', String(limit.value))
        if (q.value.trim()) qs.set('q', q.value.trim())

        const res = await api<CollectionsApiData>(`/api/admin/collections?${qs.toString()}`)
        collections.value = res.data.collections
        pagination.page = res.data.page
        pagination.limit = res.data.limit
        pagination.total = res.data.total
        pagination.pages = res.data.pages
        pagination.hasNextPage = !!res.data.hasNextPage
    } catch (e) {
        errorText.value = e instanceof Error ? e.message : 'Load collections error'
    } finally {
        isLoading.value = false
    }
}

const canPrev = computed(() => pagination.page > 1 && !isLoading.value)
const canNext = computed(() => pagination.hasNextPage && !isLoading.value)

// ===== projects picker (create) =====
const projectPicker = reactive({
    isLoading: false,
    error: '',
    search: '',
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    items: [] as ProjectLite[],
})

let projectTimer: number | null = null
function triggerProjectSearch() {
    if (projectTimer) window.clearTimeout(projectTimer)
    projectTimer = window.setTimeout(() => {
        projectPicker.page = 1
        void loadProjectPicker()
    }, 350)
}

async function loadProjectPicker() {
    projectPicker.error = ''
    projectPicker.isLoading = true

    try {
        const qs = new URLSearchParams()
        qs.set('page', String(projectPicker.page))
        qs.set('limit', String(projectPicker.limit))
        if (projectPicker.search.trim()) qs.set('search', projectPicker.search.trim())

        const res = await api<ProjectsApiData>(`/api/projects?${qs.toString()}`)

        projectPicker.items = res.data.projects
        projectPicker.totalPages = res.data.pagination.totalPages
        projectPicker.hasNext = res.data.pagination.hasNext
        projectPicker.hasPrev = res.data.pagination.hasPrev
    } catch (e) {
        projectPicker.error = e instanceof Error ? e.message : 'Load projects error'
    } finally {
        projectPicker.isLoading = false
    }
}

// ===== create =====
const createForm = reactive({
    name: '',
    description: '',
    cover: '',
    projectIds: [] as string[],
})

const selectedProjectById = reactive<Record<string, ProjectLite>>({})

const createError = ref('')
const createLoading = ref(false)

const coverPreviewOk = computed(() => isValidHttpUrl(createForm.cover) && !!createForm.cover.trim())

function isSelectedProject(id: string) {
    return createForm.projectIds.includes(id)
}

function addProject(p: ProjectLite) {
    if (!createForm.projectIds.includes(p.id)) createForm.projectIds.push(p.id)
    selectedProjectById[p.id] = p
}

function removeProject(id: string) {
    const idx = createForm.projectIds.indexOf(id)
    if (idx >= 0) createForm.projectIds.splice(idx, 1)
    delete selectedProjectById[id]
}

function toggleProject(p: ProjectLite) {
    if (isSelectedProject(p.id)) removeProject(p.id)
    else addProject(p)
}

const selectedProjects = computed(() => {
    return createForm.projectIds.map((id) => selectedProjectById[id]).filter(Boolean)
})

async function createCollection() {
    createError.value = ''
    createLoading.value = true

    try {
        const name = createForm.name.trim()
        if (!name) throw new Error('name is required')
        if (name.length < 2) throw new Error('name is too short')

        if (!isValidHttpUrl(createForm.cover)) {
            throw new Error('cover must be a valid http/https url')
        }

        await api<{ collection: any }>(`/api/admin/collections`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                description: createForm.description.trim(),
                cover: createForm.cover.trim(),
                projects: createForm.projectIds,
            }),
        })

        createForm.name = ''
        createForm.description = ''
        createForm.cover = ''
        createForm.projectIds = []
        for (const k of Object.keys(selectedProjectById)) delete selectedProjectById[k]

        page.value = 1
        await loadCollections()
    } catch (e) {
        createError.value = e instanceof Error ? e.message : 'Create collection error'
    } finally {
        createLoading.value = false
    }
}

// ===== edit/delete =====
function openEdit(c: Collection) {
    errorText.value = ''
    modal.open('editCollection', {
        collection: c,
        onSaved: () => loadCollections(),
    })
}

const deletingId = ref<string | null>(null)

async function deleteCollection(c: Collection) {
    errorText.value = ''

    const ok = window.confirm(`Delete collection "${c.name}"?`)
    if (!ok) return

    deletingId.value = c.id
    try {
        await api<{ id: string }>(`/api/admin/collections/${c.id}`, { method: 'DELETE' })

        if (collections.value.length === 1 && page.value > 1) page.value -= 1
        await loadCollections()
    } catch (e) {
        errorText.value = e instanceof Error ? e.message : 'Delete collection error'
    } finally {
        deletingId.value = null
    }
}

// ===== watchers =====
watch([page, limit], () => void loadCollections())
watch(q, () => triggerCollectionsSearch())

watch(
    () => projectPicker.page,
    () => void loadProjectPicker()
)
watch(
    () => projectPicker.search,
    () => triggerProjectSearch()
)

onMounted(async () => {
    await loadCollections()
    await loadProjectPicker()
})
</script>

<template>
    <div class="admin-collections page">
        <div class="header">
            <h2 class="title">Collections</h2>

            <div class="controls">
                <AppInput
                    id="collections-search"
                    v-model="q"
                    placeholder="Search collections by name"
                    autocomplete="off"
                />

                <AppSelect
                    class="limit"
                    id="collections-limit"
                    v-model.number="limit"
                    :options="limitOptions"
                />
            </div>
        </div>

        <AppError v-if="errorText">{{ errorText }}</AppError>

        <!-- CREATE -->
        <section class="card">
            <div class="list-head">
                <h3 class="card-title">Create collection</h3>

                <div class="cover-preview" :class="{ 'cover-preview-empty': !coverPreviewOk }">
                    <img v-if="coverPreviewOk" :src="createForm.cover" alt="cover" />
                    <span v-else class="muted">No preview</span>
                </div>
            </div>

            <AppError v-if="createError">{{ createError }}</AppError>

            <div class="grid">
                <AppInput
                    id="create-collection-name"
                    v-model="createForm.name"
                    label="name"
                    placeholder="Collection name"
                    autocomplete="off"
                />

                <AppInput
                    id="create-collection-cover"
                    v-model="createForm.cover"
                    label="cover"
                    placeholder="https://..."
                    autocomplete="off"
                />

                <AppTextarea
                    class="field-full"
                    id="create-collection-description"
                    v-model="createForm.description"
                    label="description"
                    placeholder="Collection description"
                    :rows="5"
                />

                <div class="field field-full">
                    <div class="picker-head">
                        <span class="picker-title">Selected projects</span>
                        <span class="picker-meta">Selected: {{ selectedProjects.length }}</span>
                    </div>

                    <div v-if="selectedProjects.length" class="selected">
                        <span v-for="p in selectedProjects" :key="`selected-${p.id}`" class="chip">
                            <span class="chip-text">{{ p.name }}</span>

                            <button
                                type="button"
                                class="chip-remove"
                                aria-label="Remove project"
                                @click="removeProject(p.id)"
                            >
                                ×
                            </button>
                        </span>
                    </div>
                    <div v-else class="muted">No projects selected</div>

                    <div class="project-picker">
                        <div class="project-picker-head">
                            <AppInput
                                id="collection-project-search"
                                v-model="projectPicker.search"
                                placeholder="Search projects"
                                autocomplete="off"
                            />

                            <div class="project-picker-controls">
                                <AppButton
                                    type="button"
                                    variant="sm"
                                    :disabled="projectPicker.isLoading || !projectPicker.hasPrev"
                                    @click="
                                        projectPicker.page = Math.max(projectPicker.page - 1, 1)
                                    "
                                >
                                    Prev
                                </AppButton>

                                <span class="picker-page">
                                    {{ projectPicker.page }} / {{ projectPicker.totalPages }}
                                </span>

                                <AppButton
                                    type="button"
                                    variant="sm"
                                    :disabled="projectPicker.isLoading || !projectPicker.hasNext"
                                    @click="
                                        projectPicker.page = Math.min(
                                            projectPicker.page + 1,
                                            projectPicker.totalPages
                                        )
                                    "
                                >
                                    Next
                                </AppButton>
                            </div>
                        </div>

                        <AppError v-if="projectPicker.error">{{ projectPicker.error }}</AppError>

                        <div v-if="projectPicker.isLoading" class="muted">Loading...</div>

                        <div v-else class="project-list">
                            <button
                                v-for="p in projectPicker.items"
                                :key="`pick-${p.id}`"
                                type="button"
                                class="project-row"
                                :class="{ 'project-row--active': isSelectedProject(p.id) }"
                                @click="toggleProject(p)"
                            >
                                <div
                                    class="project-thumb"
                                    :class="{ 'project-thumb--empty': !p.imageUrl }"
                                >
                                    <img v-if="p.imageUrl" :src="p.imageUrl" alt="thumb" />
                                    <span v-else class="muted">—</span>
                                </div>

                                <div class="project-info">
                                    <div class="project-name">{{ p.name }}</div>
                                    <div class="project-sub">
                                        {{
                                            isSelectedProject(p.id) ? 'Selected' : 'Click to select'
                                        }}
                                    </div>
                                </div>

                                <div class="project-action">
                                    <span class="action-pill">
                                        {{ isSelectedProject(p.id) ? 'Remove' : 'Add' }}
                                    </span>
                                </div>
                            </button>

                            <div v-if="projectPicker.items.length === 0" class="muted">
                                No projects
                            </div>
                        </div>

                        <p class="hint">
                            Only existing projects are allowed (server validates by ids).
                        </p>
                    </div>
                </div>
            </div>

            <div class="actions">
                <AppButton type="button" :disabled="createLoading" @click="createCollection">
                    {{ createLoading ? 'Creating...' : 'Create' }}
                </AppButton>
            </div>
        </section>

        <!-- LIST -->
        <section class="card">
            <div class="list-head">
                <h3 class="card-title">Collections list</h3>

                <div class="pagination">
                    <AppButton type="button" variant="sm" :disabled="!canPrev" @click="page--">
                        Prev
                    </AppButton>

                    <span class="page-info">
                        Page {{ pagination.page }} / {{ pagination.pages }} · Total
                        {{ pagination.total }}
                    </span>

                    <AppButton type="button" variant="sm" :disabled="!canNext" @click="page++">
                        Next
                    </AppButton>
                </div>
            </div>

            <div v-if="isLoading" class="muted">Loading...</div>

            <div v-else class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Collection</th>
                            <th>Projects</th>
                            <th>Created</th>
                            <th>Updated</th>
                            <th class="right">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-if="collections.length === 0">
                            <td colspan="5" class="muted">No collections</td>
                        </tr>

                        <tr v-for="c in collections" :key="c.id">
                            <td>
                                <div class="collection-cell">
                                    <div
                                        class="cover-mini"
                                        :class="{ 'cover-mini--empty': !c.cover }"
                                    >
                                        <img v-if="c.cover" :src="c.cover" alt="cover" />
                                        <span v-else class="muted">—</span>
                                    </div>

                                    <div class="collection-meta">
                                        <div class="collection-name">{{ c.name }}</div>
                                        <div v-if="c.description" class="collection-desc">
                                            {{ c.description }}
                                        </div>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <div class="projects-mini">
                                    <span class="count">{{ c.projectsCount }}</span>
                                    <div class="mini-thumbs">
                                        <span
                                            v-for="p in (c.projects ?? []).slice(0, 5)"
                                            :key="`mini-${c.id}-${p.id}`"
                                            class="mini"
                                            :class="{ 'mini--empty': !p.imageUrl }"
                                        >
                                            <img v-if="p.imageUrl" :src="p.imageUrl" alt="p" />
                                            <span v-else class="muted">—</span>
                                        </span>
                                    </div>
                                </div>
                            </td>

                            <td>{{ formatDate(c.createdAt) }}</td>
                            <td>{{ formatDate(c.updatedAt) }}</td>

                            <td class="right">
                                <div class="row-actions">
                                    <AppButton type="button" variant="sm" @click="openEdit(c)">
                                        Edit
                                    </AppButton>

                                    <AppButton
                                        type="button"
                                        variant="sm"
                                        :disabled="deletingId === c.id"
                                        @click="deleteCollection(c)"
                                    >
                                        {{ deletingId === c.id ? 'Deleting...' : 'Delete' }}
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
    padding: 16px;
    margin-bottom: 16px;
}

.card-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
}

.list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.field-full {
    grid-column: 1 / -1;
}

.cover-preview {
    width: 180px;
    height: 180px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    overflow: hidden;
    display: grid;
    place-items: center;
}

.cover-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.cover-preview-empty {
    opacity: 0.7;
}

.actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
}

.muted {
    font-size: 12px;
    opacity: 0.7;
}

.picker-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
}

.picker-title {
    font-size: 12px;
    font-weight: 700;
    color: var(--primary-color);
}

.picker-meta {
    font-size: 12px;
    opacity: 0.7;
}

.selected {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
}

.chip-text {
    font-size: 12px;
    opacity: 0.95;
}

.chip-remove {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: transparent;
    color: inherit;
    cursor: pointer;
    line-height: 1;
    display: grid;
    place-items: center;
    opacity: 0.8;
}

.chip-remove:hover {
    opacity: 1;
}

.project-picker {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 12px;
}

.project-picker-head {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    justify-content: space-between;
}

.project-picker-head :deep(.app-input-wrapper) {
    flex: 1;
}

.project-picker-controls {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    white-space: nowrap;
}

.picker-page {
    font-size: 12px;
    opacity: 0.8;
}

.project-list {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.project-row {
    display: grid;
    grid-template-columns: 44px 1fr auto;
    align-items: center;
    gap: 10px;

    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 10px;

    background: transparent;
    color: inherit;
    cursor: pointer;
    text-align: left;
}

.project-row--active {
    border-color: var(--primary-color);
}

.project-thumb {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    overflow: hidden;
    display: grid;
    place-items: center;
}

.project-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.project-thumb--empty {
    opacity: 0.7;
}

.project-name {
    font-weight: 700;
}

.project-sub {
    margin-top: 2px;
    font-size: 12px;
    opacity: 0.7;
}

.action-pill {
    display: inline-flex;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    font-size: 12px;
    opacity: 0.9;
}

.hint {
    margin: 10px 0 0;
    font-size: 12px;
    opacity: 0.65;
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

.collection-cell {
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: 10px;
    align-items: start;
    min-width: 260px;
}

.cover-mini {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    overflow: hidden;
    display: grid;
    place-items: center;
}

.cover-mini img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.cover-mini--empty {
    opacity: 0.7;
}

.collection-name {
    font-weight: 700;
}

.collection-desc {
    margin-top: 4px;
    font-size: 12px;
    max-width: 200px;
    opacity: 0.75;
    overflow: hidden;
    text-overflow: ellipsis;
}

.projects-mini {
    display: flex;
    align-items: center;
    gap: 10px;
}

.count {
    display: inline-flex;
    min-width: 26px;
    justify-content: center;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    font-size: 12px;
}

.mini-thumbs {
    display: flex;
    gap: 6px;
}

.mini {
    width: 28px;
    height: 28px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    overflow: hidden;
    display: grid;
    place-items: center;
}

.mini img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.mini--empty {
    opacity: 0.7;
}

/* adaptivity */
@media (max-width: 980px) {
    .title {
        font-size: 24px;
    }

    .controls {
        flex-wrap: wrap;
    }

    .controls .limit {
        flex: 1 1 160px;
        width: auto;
    }

    .grid {
        grid-template-columns: 1fr;
    }

    .cover-preview {
        width: 100%;
    }

    .project-picker-head {
        flex-direction: column;
        align-items: stretch;
    }

    .project-picker-controls {
        justify-content: flex-end;
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
