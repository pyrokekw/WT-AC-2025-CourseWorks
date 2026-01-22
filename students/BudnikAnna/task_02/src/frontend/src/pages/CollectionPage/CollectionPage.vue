<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import type { ApiResponse, Collection } from '@/shared/types/'
import { env } from '@/shared/config/env'

import ProjectItemComponent from '@/shared/components/ProjectItemComponent.vue'
import AppLoading from '@/shared/ui/AppLoading.vue'
import AppError from '@/shared/ui/AppError.vue'

const route = useRoute()

const id = route.params.id as string

const collection = ref<Collection | null>(null)
const loading = ref<boolean>(true)
const error = ref<string>('')

async function loadCollection() {
    loading.value = true
    error.value = ''

    try {
        const res = await fetch(`${env.API_URL}/api/collections/${id}`, {
            method: 'GET',
        })
        const json: ApiResponse<{ collection: Collection }> = await res.json()

        if (!json.success) {
            throw new Error(json.message)
        }

        collection.value = json.data.collection
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Fetch Error'
        error.value = message
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadCollection()
})
</script>

<template>
    <div v-if="error" class="app-wrapper">
        <AppError>{{ error }}</AppError>
    </div>

    <div v-if="loading" class="app-wrapper collection-page-loading-wrapper">
        <div class="collection-page-loading">
            <AppLoading />
        </div>
    </div>

    <div class="app-wrapper">
        <div class="collection-page-info">
            <h1 class="collection-page-title">{{ collection?.name }}</h1>
            <p class="text-description collection-page-description">
                {{ collection?.description }}
            </p>
        </div>

        <div class="collection-page-projects">
            <ProjectItemComponent v-for="project in collection?.projects" :project="project" />
        </div>
    </div>
</template>

<style scoped>
.collection-page-loading {
    text-transform: uppercase;
    font-size: 24px;
    font-weight: 700;
}

.collection-page-info {
    margin-top: 40px;
}

.collection-page-loading-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.collection-page-title {
    font-weight: 700;
    font-size: 32px;
    text-transform: uppercase;
}

.collection-page-description {
    margin-top: 12px;
}

.collection-page-projects {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 30px;
    margin-top: 30px;
}

@media (max-width: 1024px) {
    .collection-page-projects {
        max-width: 770px;
        width: 100%;
        grid-template-columns: 1fr 1fr;
        margin-left: auto;
        margin-right: auto;
    }
}

@media (max-width: 1024px) {
    .collection-page-projects {
        max-width: 370px;
        grid-template-columns: 1fr;
    }
}
</style>
