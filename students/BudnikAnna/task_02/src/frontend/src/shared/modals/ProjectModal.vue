<script setup lang="ts">
import { computed } from 'vue'
import { useModalStore } from '@/stores/modal'
import type { Project } from '../types'
import { dateFormated } from '../utils/date-formatted'
import AppTag from '../ui/AppTag.vue'

const modal = useModalStore()
const payload = modal.payload as Project

const createdAtFormatted = computed(() => {
    return dateFormated(payload.createdAt || '')
})
</script>

<template>
    <div class="project-modal-content">
        <h3 class="project-modal-title">{{ payload.name }}</h3>
        <h4 class="project-modal-date">{{ createdAtFormatted }}</h4>
        <div class="project-modal-tags">
            <AppTag
                :key="`project-modal-tag-${tag._id}`"
                v-for="tag in payload.tags"
                :name="tag.name"
                :color="tag.color || ''"
            />
        </div>
        <div class="project-modal-photo">
            <img :src="payload.imageUrl" :alt="payload.name" />
        </div>
        <p class="project-modal-description text-description">{{ payload.description }}</p>
    </div>
</template>

<style scoped>
.project-modal-content {
    padding-top: 24px;
}

.project-modal-title {
    font-size: 24px;
    font-weight: 700;
    word-break: break-all;
    text-transform: uppercase;
}

.project-modal-date {
    font-weight: 600;
    margin-top: 6px;
    text-transform: uppercase;
    font-size: 12px;
}

.project-modal-photo {
    margin-top: 12px;
    width: 100%;
    height: auto;
    border-radius: 12px;
    overflow: hidden;
    min-height: 100px;
    max-height: 400px;
}

.project-modal-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.project-modal-description {
    margin-top: 12px;
    word-break: break-all;
}

.project-modal-tags {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.project-modal-tag {
    border: 1px solid var(--primary-color);
    padding: 5px 10px;
    border-radius: 30px;
    font-size: 12px;
    text-transform: uppercase;
    font-weight: 500;
}
</style>
