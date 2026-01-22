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
    <div class="app-wrapper">
        <section class="app-collections">
            <!-- <div class="app-collections-head">
                <h3 class="app-collections-head-title">Collections</h3>
            </div> -->
            <div v-if="loading" class="app-collections-loading">
                <AppLoading />
            </div>
            <div v-if="!loading && collections.length > 0" class="app-collections-items">
                <CollectionLandingItemComponent
                    v-for="collection in collections"
                    :collection="collection"
                />
            </div>
        </section>
    </div>
</template>

<style scoped>
.app-collections {
    margin-top: 60px;
}

.app-collections-head {
    margin-bottom: 30px;
}

.app-collections-head-title {
    text-align: center;
    text-transform: uppercase;
    font-weight: 700;
    font-size: 24px;
    letter-spacing: 1px;
}

.app-collections-items {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
}

.app-collections-loading {
    text-align: center;
    padding-top: 20px;
    padding-bottom: 20px;
    font-size: 24px;
    text-transform: uppercase;
    font-weight: 700;
}

@media (max-width: 1024px) {
    .app-collections-items {
        max-width: 570px;
        margin: 0 auto;
        grid-template-columns: 1fr;
        column-gap: 42px;
    }
}
</style>
