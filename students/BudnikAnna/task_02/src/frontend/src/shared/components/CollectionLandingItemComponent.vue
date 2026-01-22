<script setup lang="ts">
import { computed } from 'vue'
import type { CollectionLanding } from '@/shared/types/'
import { RouterLink } from 'vue-router'
import { dateFormated } from '../utils/date-formatted'

const props = defineProps<{
    collection: CollectionLanding
}>()

const createdAtFormatted = computed(() => {
    return dateFormated(props.collection.createdAt || '')
})
</script>

<template>
    <RouterLink
        :to="`/collections/${encodeURI(collection.id)}`"
        class="app-card-wrapper app-collection-item-landing"
    >
        <div class="app-card app-collection-item-landing-inner">
            <div class="app-collection-item-landing-photo">
                <img :src="collection.cover" :alt="collection.name" />
            </div>
            <div class="app-card-content app-collection-item-landing-content">
                <h3 class="app-collection-item-landing-title">{{ collection.name }}</h3>
                <p class="text-description app-collection-item-landing-paragraph">
                    {{ collection.description }}
                </p>
                <div class="app-collection-item-landing-bottom">
                    <span> projects: {{ collection.projectsCount }} </span>
                    <span> {{ createdAtFormatted }}</span>
                </div>
            </div>
        </div>
    </RouterLink>
</template>

<style scoped>
.app-collection-item-landing {
    min-height: 180px;
}

.app-collection-item-landing-inner {
    display: grid;
    grid-template-columns: 192px 1fr;
    overflow: hidden;
    height: 100%;
}

.app-collection-item-landing-photo {
    width: 192px;
    height: 100%;
}

.app-collection-item-landing-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.app-collection-item-landing-content {
    display: flex;
    flex-direction: column;
}

.app-collection-item-landing-title {
    font-size: 18px;
    font-weight: 700;
    text-transform: uppercase;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.app-collection-item-landing-paragraph {
    margin-top: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
}

.app-collection-item-landing-bottom {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    font-size: 14px;
    text-transform: uppercase;
    margin-top: auto;
    padding-top: 6px;
}

@media (max-width: 515px) {
    .app-collection-item-landing-inner {
        display: grid;
        grid-template-columns: 128px 1fr;
        overflow: hidden;
        height: 100%;
    }

    .app-collection-item-landing-photo {
        width: 128px;
    }
}

@media (max-width: 430px) {
    .app-collection-item-landing-bottom {
        padding-top: 12px;
        flex-direction: column;
        row-gap: 6px;
        font-size: 12px;
    }
}
</style>
