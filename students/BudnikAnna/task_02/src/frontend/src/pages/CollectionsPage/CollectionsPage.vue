<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { ApiResponse, CollectionLanding } from '@/shared/types/'
import { env } from '@/shared/config/env'

import CollectionLandingItemComponent from '@/shared/components/CollectionLandingItemComponent.vue'
import AppLoading from '@/shared/ui/AppLoading.vue'

const collections = ref<CollectionLanding[]>([])
const loading = ref<boolean>(true)
const error = ref<string>('')

async function loadCollections() {
    loading.value = true
    error.value = ''

    try {
        const res = await fetch(`${env.API_URL}/api/collections`, {
            method: 'GET',
        })
        const json: ApiResponse<{ collections: CollectionLanding[] }> = await res.json()

        if (!json.success) {
            throw new Error(json.message)
        }

        collections.value = json.data.collections
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Fetch Error'
        error.value = message
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    loadCollections()
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
        <div class="collection-page-projects">
            <CollectionLandingItemComponent
                v-for="collection in collections"
                :collection="collection"
            />
        </div>
    </div>
</template>

<style scoped>
.collection-page-loading {
    text-transform: uppercase;
    font-size: 24px;
    font-weight: 700;
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
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-top: 30px;
}

@media (max-width: 1024px) {
    .collection-page-projects {
        max-width: 770px;
        width: 100%;
        grid-template-columns: 1fr;
        margin-left: auto;
        margin-right: auto;
    }
}
</style>
