<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue'
import { useModalStore } from '@/stores/modal'
import { useAuthStore } from '@/stores/auth'
import { env } from '@/shared/config/env'

import AppButton from '@/shared/ui/AppButton.vue'
import AppInput from '@/shared/ui/AppInput.vue'
import AppTextarea from '@/shared/ui/AppTextarea.vue'
import AppError from '@/shared/ui/AppError.vue'

type Tag = { id: string; name: string; color: string }
type Project = {
    id: string
    name: string
    description?: string
    imageUrl?: string
    stack: string[]
    tags: string[] // tag names
    createdAt?: string
    updatedAt?: string
}

type EditProjectPayload = {
    project: Project
    allTags: Tag[]
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

const payload = computed(() => props.payload as EditProjectPayload | undefined)

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

function normalizeTagName(v: string) {
    return v.trim().toLowerCase()
}

const form = reactive({
    id: '',
    name: '',
    description: '',
    imageUrl: '',
    stackText: '',
    tags: [] as string[], // normalized tag names
})

const state = reactive({
    isLoading: false,
    error: '',
})

const tagNameSet = computed(() => {
    const set = new Set<string>()
    for (const t of payload.value?.allTags ?? []) set.add(normalizeTagName(t.name))
    return set
})

watchEffect(() => {
    const p = payload.value?.project
    if (!p) return

    form.id = p.id
    form.name = p.name
    form.description = p.description ?? ''
    form.imageUrl = p.imageUrl ?? ''
    form.stackText = (p.stack ?? []).join(', ')

    const normalized = Array.from(
        new Set((Array.isArray(p.tags) ? p.tags : []).map(normalizeTagName).filter(Boolean))
    )

    // keep only existing tags from payload (avoid server-side "not found")
    form.tags = normalized.filter((n) => tagNameSet.value.has(n))
})

const previewImageOk = computed(() => isValidHttpUrl(form.imageUrl) && !!form.imageUrl.trim())

const selectedTagCount = computed(() => form.tags.length)

function addTag(name: string) {
    const n = normalizeTagName(name)
    if (!n) return
    if (!tagNameSet.value.has(n)) return
    if (!form.tags.includes(n)) form.tags.push(n)
}

function removeTag(name: string) {
    const n = normalizeTagName(name)
    const idx = form.tags.indexOf(n)
    if (idx >= 0) form.tags.splice(idx, 1)
}

function toggleTag(name: string) {
    const n = normalizeTagName(name)
    if (!n) return
    if (form.tags.includes(n)) removeTag(n)
    else addTag(n)
}

async function onSubmit() {
    state.error = ''
    state.isLoading = true

    try {
        const name = form.name.trim()
        if (name.length < 2) throw new Error('name is too short')

        if (!isValidHttpUrl(form.imageUrl)) {
            throw new Error('imageUrl must be a valid http/https url')
        }

        const stack = parseCsv(form.stackText)

        // final tag list: normalized, existing only
        const tags = Array.from(new Set(form.tags.map(normalizeTagName).filter(Boolean))).filter(
            (n) => tagNameSet.value.has(n)
        )

        await api<{ project: Project }>(`/api/admin/projects/${form.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                name,
                description: form.description.trim(),
                stack,
                tags,
                imageUrl: form.imageUrl.trim(),
            }),
        })

        await payload.value?.onSaved?.()
        modal.close()
    } catch (e) {
        state.error = e instanceof Error ? e.message : 'Update project error'
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
        <h3 class="title">Edit project</h3>

        <form class="form" @submit.prevent="onSubmit">
            <AppInput
                v-model="form.name"
                id="edit-project-name"
                name="name"
                autocomplete="off"
                label="name"
                placeholder="Project name"
            />

            <AppTextarea
                id="edit-project-description"
                v-model="form.description"
                label="description"
                placeholder="Project description"
                :rows="5"
            />

            <div class="image-row">
                <AppInput
                    v-model="form.imageUrl"
                    id="edit-project-image"
                    name="imageUrl"
                    autocomplete="off"
                    label="imageUrl"
                    placeholder="https://..."
                />
                <div class="image-preview" :class="{ 'image-preview-empty': !previewImageOk }">
                    <img v-if="previewImageOk" :src="form.imageUrl" alt="preview" />
                    <span v-else class="muted">No preview</span>
                </div>
            </div>

            <AppInput
                v-model="form.stackText"
                id="edit-project-stack"
                name="stack"
                autocomplete="off"
                label="stack (comma separated)"
                placeholder="vue, pinia, node, mongodb"
            />

            <div class="field">
                <div class="picker-head">
                    <span class="picker-title">Selected tags</span>
                    <span class="picker-meta">Selected: {{ selectedTagCount }}</span>
                </div>

                <div v-if="form.tags.length" class="selected">
                    <span v-for="tName in form.tags" :key="`selected-${tName}`" class="chip">
                        <span class="chip-dot" />
                        <span class="chip-text">{{ tName }}</span>

                        <button
                            type="button"
                            class="chip-remove"
                            aria-label="Remove tag"
                            @click="removeTag(tName)"
                        >
                            ×
                        </button>
                    </span>
                </div>

                <div v-else class="muted">No tags selected</div>

                <div class="tags">
                    <button
                        v-for="t in payload?.allTags ?? []"
                        :key="t.id"
                        type="button"
                        class="tag"
                        :class="{ 'tag-active': form.tags.includes(t.name.toLowerCase()) }"
                        :style="{ borderColor: t.color }"
                        @click="toggleTag(t.name)"
                    >
                        <span class="dot" :style="{ backgroundColor: t.color }" />
                        {{ t.name }}
                    </button>
                </div>

                <p class="hint">Click tags to add/remove. Only existing tags are allowed.</p>
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

.image-row {
    display: grid;
    grid-template-columns: 1fr 200px;
    gap: 12px;
    align-items: end;
}

.image-preview {
    height: 128px;
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

.image-preview-empty {
    opacity: 0.7;
}

.muted {
    font-size: 12px;
    opacity: 0.7;
}

.tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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

.hint {
    margin: 0;
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
    .image-row {
        grid-template-columns: 1fr;
    }
    .image-preview {
        height: 180px;
    }
}
</style>
