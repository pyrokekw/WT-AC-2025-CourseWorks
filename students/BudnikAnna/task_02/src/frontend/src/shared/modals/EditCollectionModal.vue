<script setup lang="ts">
import { computed, reactive, ref, watchEffect, watch, onMounted } from 'vue'
import { useModalStore } from '@/stores/modal'
import { useAuthStore } from '@/stores/auth'
import { env } from '@/shared/config/env'

import AppButton from '@/shared/ui/AppButton.vue'
import AppInput from '@/shared/ui/AppInput.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'
import AppError from '@/shared/ui/AppError.vue'

type ProjectLite = {
    id: string
    name: string
    imageUrl?: string
    tags?: any
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

type EditCollectionPayload = {
    collection: Collection
    onSaved?: () => void | Promise<void>
}

type ApiResponse<T> = {
    message: string
    success: boolean
    data: T
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

const props = defineProps<{ payload?: unknown }>()

const modal = useModalStore()
const auth = useAuthStore()

const payload = computed(() => props.payload as EditCollectionPayload | undefined)

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

const form = reactive({
    id: '',
    name: '',
    description: '',
    cover: '',
    projectIds: [] as string[],
})

const selectedProjectById = reactive<Record<string, ProjectLite>>({})

const state = reactive({
    isLoading: false,
    error: '',
})

const picker = reactive({
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

let searchTimer: number | null = null
function triggerSearch() {
    if (searchTimer) window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(() => {
        picker.page = 1
        void loadPicker()
    }, 350)
}

async function loadPicker() {
    picker.error = ''
    picker.isLoading = true

    try {
        const qs = new URLSearchParams()
        qs.set('page', String(picker.page))
        qs.set('limit', String(picker.limit))
        if (picker.search.trim()) qs.set('search', picker.search.trim())

        const res = await api<ProjectsApiData>(`/api/projects?${qs.toString()}`)
        picker.items = res.data.projects
        picker.totalPages = res.data.pagination.totalPages
        picker.hasNext = res.data.pagination.hasNext
        picker.hasPrev = res.data.pagination.hasPrev
    } catch (e) {
        picker.error = e instanceof Error ? e.message : 'Load projects error'
    } finally {
        picker.isLoading = false
    }
}

watch(
    () => picker.page,
    () => void loadPicker()
)
watch(
    () => picker.search,
    () => triggerSearch()
)

watchEffect(() => {
    const c = payload.value?.collection
    if (!c) return

    form.id = c.id
    form.name = c.name
    form.description = c.description ?? ''
    form.cover = c.cover ?? ''

    form.projectIds = (c.projects ?? []).map((p) => p.id)

    for (const k of Object.keys(selectedProjectById)) delete selectedProjectById[k]
    for (const p of c.projects ?? []) selectedProjectById[p.id] = p
})

const coverPreviewOk = computed(() => isValidHttpUrl(form.cover) && !!form.cover.trim())

function isSelected(id: string) {
    return form.projectIds.includes(id)
}

function addProject(p: ProjectLite) {
    if (!form.projectIds.includes(p.id)) form.projectIds.push(p.id)
    selectedProjectById[p.id] = p
}

function removeProject(id: string) {
    const idx = form.projectIds.indexOf(id)
    if (idx >= 0) form.projectIds.splice(idx, 1)
    delete selectedProjectById[id]
}

function toggleProject(p: ProjectLite) {
    if (isSelected(p.id)) removeProject(p.id)
    else addProject(p)
}

const selectedProjects = computed(() => {
    return form.projectIds.map((id) => selectedProjectById[id]).filter(Boolean)
})

async function onSubmit() {
    state.error = ''
    state.isLoading = true

    try {
        const name = form.name.trim()
        if (!name) throw new Error('name is required')
        if (name.length < 2) throw new Error('name is too short')

        if (!isValidHttpUrl(form.cover)) {
            throw new Error('cover must be a valid http/https url')
        }

        await api<{ collection: any }>(`/api/admin/collections/${form.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                name,
                description: form.description.trim(),
                cover: form.cover.trim(),
                projects: form.projectIds,
            }),
        })

        await payload.value?.onSaved?.()
        modal.close()
    } catch (e) {
        state.error = e instanceof Error ? e.message : 'Update collection error'
    } finally {
        state.isLoading = false
    }
}

function onCancel() {
    modal.close()
}

onMounted(() => {
    void loadPicker()
})
</script>

<template>
    <div class="content">
        <h3 class="title">Edit collection</h3>

        <form class="form" @submit.prevent="onSubmit">
            <AppInput
                v-model="form.name"
                id="edit-collection-name"
                label="name"
                placeholder="Collection name"
                autocomplete="off"
            />

            <AppTextarea
                id="edit-collection-description"
                v-model="form.description"
                label="description"
                placeholder="Collection description"
                :rows="5"
            />

            <div class="cover-row">
                <AppInput
                    v-model="form.cover"
                    id="edit-collection-cover"
                    label="cover"
                    placeholder="https://..."
                    autocomplete="off"
                />

                <div class="cover-preview" :class="{ 'cover-preview--empty': !coverPreviewOk }">
                    <img v-if="coverPreviewOk" :src="form.cover" alt="cover" />
                    <span v-else class="muted">No preview</span>
                </div>
            </div>

            <div class="field">
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

                <div class="picker">
                    <div class="picker-top">
                        <AppInput
                            id="edit-collection-project-search"
                            v-model="picker.search"
                            placeholder="Search projects"
                            autocomplete="off"
                        />

                        <div class="picker-controls">
                            <AppButton
                                type="button"
                                variant="sm"
                                :disabled="picker.isLoading || !picker.hasPrev"
                                @click="picker.page = Math.max(picker.page - 1, 1)"
                            >
                                Prev
                            </AppButton>

                            <span class="picker-page"
                                >{{ picker.page }} / {{ picker.totalPages }}</span
                            >

                            <AppButton
                                type="button"
                                variant="sm"
                                :disabled="picker.isLoading || !picker.hasNext"
                                @click="picker.page = Math.min(picker.page + 1, picker.totalPages)"
                            >
                                Next
                            </AppButton>
                        </div>
                    </div>

                    <AppError v-if="picker.error">{{ picker.error }}</AppError>

                    <div v-if="picker.isLoading" class="muted">Loading...</div>

                    <div v-else class="project-list">
                        <button
                            v-for="p in picker.items"
                            :key="`pick-${p.id}`"
                            type="button"
                            class="project-row"
                            :class="{ 'project-row--active': isSelected(p.id) }"
                            @click="toggleProject(p)"
                        >
                            <div class="thumb" :class="{ 'thumb--empty': !p.imageUrl }">
                                <img v-if="p.imageUrl" :src="p.imageUrl" alt="thumb" />
                                <span v-else class="muted">—</span>
                            </div>

                            <div class="info">
                                <div class="name">{{ p.name }}</div>
                                <div class="sub">
                                    {{ isSelected(p.id) ? 'Selected' : 'Click to select' }}
                                </div>
                            </div>

                            <span class="action-pill">{{
                                isSelected(p.id) ? 'Remove' : 'Add'
                            }}</span>
                        </button>

                        <div v-if="picker.items.length === 0" class="muted">No projects</div>
                    </div>

                    <p class="hint">
                        Only existing projects are allowed (server validates by ids).
                    </p>
                </div>
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
}

.title {
    font-size: 24px;
    font-weight: 700;
}

.form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 18px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.muted {
    font-size: 12px;
    opacity: 0.7;
}

.cover-row {
    display: grid;
    grid-template-columns: 1fr 220px;
    gap: 12px;
    align-items: end;
}

.cover-preview {
    height: 56px;
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

.cover-preview--empty {
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

.picker {
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 12px;
}

.picker-top {
    display: flex;
    gap: 10px;
    align-items: flex-end;
    justify-content: space-between;
}

.picker-top :deep(.app-input-wrapper) {
    flex: 1;
}

.picker-controls {
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

.thumb--empty {
    opacity: 0.7;
}

.name {
    font-weight: 700;
}

.sub {
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

.controls {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    margin-top: 6px;
}

@media (max-width: 900px) {
    .cover-row {
        grid-template-columns: 1fr;
    }
    .cover-preview {
        height: 180px;
    }
    .picker-top {
        flex-direction: column;
        align-items: stretch;
    }
    .picker-controls {
        justify-content: flex-end;
    }
}
</style>
