<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'

import AppButton from '@/shared/ui/AppButton.vue'
import AppInput from '@/shared/ui/AppInput.vue'
import AppSelect from '@/shared/ui/AppSelect.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'

import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modal'
import { env } from '@/shared/config/env'
import AppError from '@/shared/ui/AppError.vue'

type Tag = { id: string; name: string; color: string }

type Project = {
    id: string
    name: string
    description?: string
    stack: string[]
    tags: string[] // tag names
    imageUrl?: string
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

function parseCsv(value: string): string[] {
    return Array.from(
        new Set(
            value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
        )
    )
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

// ====== list state ======
const isLoading = ref(false)
const errorText = ref('')

const tags = ref<Tag[]>([])
const projects = ref<Project[]>([])

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
const filterTag = ref('') // tag name

const limitOptions = [
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
] as const

const tagFilterOptions = computed(() => {
    return [
        { label: 'All tags', value: '' },
        ...tags.value.map((t) => ({ label: t.name, value: t.name })),
    ] as const
})

const tagNameSet = computed(() => new Set(tags.value.map((t) => t.name)))

let searchTimer: number | null = null
function triggerSearchReload() {
    if (searchTimer) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => {
        page.value = 1
        void loadProjects()
    }, 350)
}

async function loadTags() {
    const res = await api<{ tags: Tag[] }>(`/api/tags`)
    tags.value = res.data.tags
}

async function loadProjects() {
    errorText.value = ''
    isLoading.value = true

    try {
        const qs = new URLSearchParams()
        qs.set('page', String(page.value))
        qs.set('limit', String(limit.value))
        if (search.value.trim()) qs.set('search', search.value.trim())
        if (filterTag.value.trim()) qs.set('tag', filterTag.value.trim())

        const res = await api<{ projects: Project[]; pagination: Pagination }>(
            `/api/projects?${qs.toString()}`
        )

        projects.value = res.data.projects
        Object.assign(pagination, res.data.pagination)
    } catch (e) {
        errorText.value = e instanceof Error ? e.message : 'Load projects error'
    } finally {
        isLoading.value = false
    }
}

// ====== create state ======
const createForm = reactive({
    name: '',
    description: '',
    imageUrl: '',
    stackText: '',
    tags: [] as string[], // selected tag names (normalized)
})

const createError = ref('')
const createLoading = ref(false)

const createPreviewOk = computed(
    () => isValidHttpUrl(createForm.imageUrl) && !!createForm.imageUrl.trim()
)

function normalizeTagName(v: string) {
    return v.trim().toLowerCase()
}

function addCreateTag(name: string) {
    const n = normalizeTagName(name)
    if (!n) return
    if (!tagNameSet.value.has(n)) return // keep only existing tags
    if (!createForm.tags.includes(n)) createForm.tags.push(n)
}

function removeCreateTag(name: string) {
    const n = normalizeTagName(name)
    const idx = createForm.tags.indexOf(n)
    if (idx >= 0) createForm.tags.splice(idx, 1)
}

function toggleCreateTag(name: string) {
    const n = normalizeTagName(name)
    if (!n) return
    if (createForm.tags.includes(n)) removeCreateTag(n)
    else addCreateTag(n)
}

const selectedTagCount = computed(() => createForm.tags.length)

async function createProject() {
    createError.value = ''
    createLoading.value = true

    try {
        const name = createForm.name.trim()
        if (!name) throw new Error('name is required')
        if (name.length < 2) throw new Error('name is too short')

        if (!isValidHttpUrl(createForm.imageUrl)) {
            throw new Error('imageUrl must be a valid http/https url')
        }

        const stack = parseCsv(createForm.stackText)
        const tagsNames = createForm.tags

        const missing = tagsNames.filter((n) => !tagNameSet.value.has(n))
        if (missing.length) {
            throw new Error(`Tags not found: ${missing.join(', ')}`)
        }

        await api<{ project: Project }>(`/api/admin/projects`, {
            method: 'POST',
            body: JSON.stringify({
                name,
                description: createForm.description.trim(),
                stack,
                tags: tagsNames,
                imageUrl: createForm.imageUrl.trim(),
            }),
        })

        createForm.name = ''
        createForm.description = ''
        createForm.imageUrl = ''
        createForm.stackText = ''
        createForm.tags = []

        page.value = 1
        await loadProjects()
    } catch (e) {
        createError.value = e instanceof Error ? e.message : 'Create project error'
    } finally {
        createLoading.value = false
    }
}

// ====== edit/delete ======
function openEdit(p: Project) {
    errorText.value = ''
    modal.open('editProject', {
        project: p,
        allTags: tags.value,
        onSaved: () => loadProjects(),
    })
}

const deletingId = ref<string | null>(null)

async function deleteProject(p: Project) {
    errorText.value = ''

    const ok = window.confirm(`Delete project "${p.name}"?`)
    if (!ok) return

    deletingId.value = p.id
    try {
        await api<{ deletedProjectId: string }>(`/api/admin/projects/${p.id}`, {
            method: 'DELETE',
        })

        if (projects.value.length === 1 && page.value > 1) page.value -= 1
        await loadProjects()
    } catch (e) {
        errorText.value = e instanceof Error ? e.message : 'Delete project error'
    } finally {
        deletingId.value = null
    }
}

// ====== watchers ======
watch([page, limit], () => void loadProjects())
watch(search, () => triggerSearchReload())
watch(filterTag, () => {
    page.value = 1
    void loadProjects()
})

const canPrev = computed(() => pagination.hasPrev && !isLoading.value)
const canNext = computed(() => pagination.hasNext && !isLoading.value)

onMounted(async () => {
    try {
        await loadTags()
    } catch (e) {
        console.log(e)
    }
    await loadProjects()
})
</script>

<template>
    <div class="admin-projects page">
        <div class="header">
            <h2 class="title">Projects</h2>

            <div class="controls">
                <AppInput
                    id="projects-search"
                    v-model="search"
                    placeholder="Search by name/description/stack/tag"
                    autocomplete="off"
                />

                <AppSelect
                    class="tagFilter"
                    id="projects-tag-filter"
                    v-model="filterTag"
                    :options="tagFilterOptions"
                    label=""
                />

                <AppSelect
                    class="limit"
                    id="projects-limit"
                    v-model.number="limit"
                    :options="limitOptions"
                />
            </div>
        </div>

        <AppError v-if="errorText">{{ errorText }}</AppError>

        <!-- CREATE -->
        <section class="card">
            <div class="list-head">
                <h3 class="card-title">Create project</h3>

                <div class="image-preview" :class="{ 'image-preview--empty': !createPreviewOk }">
                    <img v-if="createPreviewOk" :src="createForm.imageUrl" alt="preview" />
                    <span v-else class="muted">No preview</span>
                </div>
            </div>

            <p v-if="createError" class="error">{{ createError }}</p>

            <div class="grid">
                <AppInput
                    id="create-project-name"
                    v-model="createForm.name"
                    placeholder="Project name"
                    autocomplete="off"
                    label="name"
                />

                <AppInput
                    id="create-project-imageUrl"
                    v-model="createForm.imageUrl"
                    placeholder="https://..."
                    autocomplete="off"
                    label="imageUrl"
                />

                <AppTextarea
                    class="field-full"
                    id="create-project-description"
                    v-model="createForm.description"
                    label="description"
                    placeholder="Project description"
                    :rows="5"
                />

                <div class="field field-full">
                    <div class="picker-head">
                        <span class="picker-title">Selected tags</span>
                        <span class="picker-meta">Selected: {{ selectedTagCount }}</span>
                    </div>

                    <div v-if="createForm.tags.length" class="selected">
                        <span
                            v-for="tName in createForm.tags"
                            :key="`selected-${tName}`"
                            class="chip"
                        >
                            <span class="chip-dot" />
                            <span class="chip-text">{{ tName }}</span>

                            <button
                                type="button"
                                class="chip-remove"
                                aria-label="Remove tag"
                                @click="removeCreateTag(tName)"
                            >
                                ×
                            </button>
                        </span>
                    </div>

                    <div v-else class="muted">No tags selected</div>

                    <div class="tags">
                        <button
                            v-for="t in tags"
                            :key="t.id"
                            type="button"
                            class="tag"
                            :class="{
                                'tag-active': createForm.tags.includes(t.name.toLowerCase()),
                            }"
                            :style="{ borderColor: t.color }"
                            @click="toggleCreateTag(t.name)"
                        >
                            <span class="dot" :style="{ backgroundColor: t.color }" />
                            {{ t.name }}
                        </button>
                    </div>

                    <p class="hint">Click tags to add/remove. Only existing tags are allowed.</p>
                </div>
            </div>

            <div class="actions">
                <AppButton :disabled="createLoading" type="button" @click="createProject">
                    {{ createLoading ? 'Creating...' : 'Create' }}
                </AppButton>
            </div>
        </section>

        <!-- LIST -->
        <section class="card">
            <div class="list-head">
                <h3 class="card-title">Projects list</h3>

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
                            <th>Project</th>
                            <th>Tags</th>
                            <th>Stack</th>
                            <th>Created</th>
                            <th>Updated</th>
                            <th class="right">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-if="projects.length === 0">
                            <td colspan="6" class="muted">No projects</td>
                        </tr>

                        <tr v-for="p in projects" :key="p.id">
                            <td>
                                <div class="project-cell">
                                    <div class="thumb" :class="{ 'thumb-empty': !p.imageUrl }">
                                        <img v-if="p.imageUrl" :src="p.imageUrl" alt="thumb" />
                                        <span v-else class="muted">—</span>
                                    </div>

                                    <div class="project-meta">
                                        <div class="project-name">{{ p.name }}</div>
                                        <div v-if="p.description" class="project-desc">
                                            {{ p.description }}
                                        </div>
                                    </div>
                                </div>
                            </td>

                            <td>
                                <div class="tags">
                                    <span
                                        v-for="tName in p.tags ?? []"
                                        :key="`${p.id}-${tName}`"
                                        class="tag-pill"
                                    >
                                        {{ tName }}
                                    </span>
                                </div>
                            </td>

                            <td>
                                <div class="stack">
                                    <span
                                        v-for="s in p.stack ?? []"
                                        :key="`${p.id}-${s}`"
                                        class="stack-pill"
                                    >
                                        {{ s }}
                                    </span>
                                </div>
                            </td>

                            <td>{{ formatDate(p.createdAt) }}</td>
                            <td>{{ formatDate(p.updatedAt) }}</td>

                            <td class="right">
                                <div class="row-actions">
                                    <AppButton type="button" @click="openEdit(p)" variant="sm">
                                        Edit
                                    </AppButton>

                                    <AppButton
                                        type="button"
                                        :disabled="deletingId === p.id"
                                        @click="deleteProject(p)"
                                        variant="sm"
                                    >
                                        {{ deletingId === p.id ? 'Deleting...' : 'Delete' }}
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

.controls .tagFilter {
    flex: 0 0 200px;
    width: 200px;
}

.controls .limit {
    flex: 0 0 140px;
    width: 140px;
}

.selected {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;

    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
}

.chip-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.2);
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

.card {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 16px;
}

.card-title {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 700;
}

.list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.field-full {
    grid-column: 1 / -1;
}

.image-preview {
    width: 140px;
    height: 56px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    overflow: hidden;
    display: grid;
    place-items: center;
}

.image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.image-preview--empty {
    opacity: 0.7;
}

.actions {
    display: flex;
    gap: 10px;
    margin-top: 14px;
    justify-content: flex-end;
}

.muted {
    opacity: 0.7;
    font-size: 12px;
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

.project-cell {
    display: grid;
    grid-template-columns: 44px 1fr;
    gap: 10px;
    align-items: start;
    min-width: 260px;
}

.thumb {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    overflow: hidden;
    display: grid;
    place-items: center;
}

.thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.thumb-empty {
    opacity: 0.65;
}

.project-name {
    font-weight: 700;
}

.project-desc {
    margin-top: 4px;
    font-size: 12px;
    max-width: 200px;
    opacity: 0.75;
    overflow: hidden;
    text-overflow: ellipsis;
}

.tags,
.stack {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: transparent;
    color: inherit;
    cursor: pointer;
}

.tag-active {
    border-color: var(--primary-color);
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
}

.tag-pill,
.stack-pill {
    display: inline-flex;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.14);
    font-size: 12px;
    opacity: 0.9;
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

.hint {
    margin: 0;
    font-size: 12px;
    opacity: 0.65;
}

/* adaptivity */
@media (max-width: 980px) {
    .title {
        font-size: 24px;
    }

    .controls {
        flex-wrap: wrap;
    }

    .controls .tagFilter,
    .controls .limit {
        flex: 1 1 180px;
        width: auto;
    }

    .grid {
        grid-template-columns: 1fr;
    }

    .image-preview {
        width: 100%;
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

    .controls .tagFilter,
    .controls .limit {
        width: 100%;
    }

    .list-head {
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
    }
}

@media (max-width: 520px) {
    .table th:nth-child(4),
    .table td:nth-child(4),
    .table th:nth-child(5),
    .table td:nth-child(5) {
        display: none;
    }
}
</style>
