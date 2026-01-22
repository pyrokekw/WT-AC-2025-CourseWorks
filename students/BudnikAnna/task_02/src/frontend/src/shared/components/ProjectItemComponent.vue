<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '@/shared/types/'
import { useModalStore } from '@/stores/modal'
import AppTag from '../ui/AppTag.vue'

const modal = useModalStore()

const props = defineProps<{
    project: Project
}>()

const createdYear = computed(() => {
    const value = props.project.createdAt

    if (!value) return ''

    const date = new Date(value)
    const year = date.getFullYear()

    return Number.isNaN(year) ? '' : year
})

function handleClick() {
    modal.open('project', props.project)
}
</script>

<template>
    <div class="app-card-wrapper project-item-wrapper" @click="handleClick">
        <div class="app-card project-item">
            <div class="project-item-photo">
                <img :src="project?.imageUrl" alt="" />
            </div>
            <div class="app-card-content">
                <div class="project-item-content-head">
                    <h3 class="project-item-title">{{ project.name }}</h3>
                    <h4 class="project-item-year">{{ createdYear }}</h4>
                </div>
                <div class="project-item-content-tags">
                    <AppTag
                        :key="`collection-page-project-tag-${tag._id}`"
                        v-for="tag in project.tags"
                        :name="tag.name"
                        :color="tag.color || ''"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.project-item {
    overflow: hidden;
}

.project-item-wrapper {
    cursor: pointer;
}

.project-item-photo {
    width: 100%;
    height: 300px;
    background-color: var(--gray-color);
}

.project-item-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.project-item-content-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12px;
}

.project-item-title {
    font-size: 16px;
    font-weight: 700;
    text-transform: uppercase;
}

.project-item-year {
    font-size: 16px;
    font-weight: 700;
}

.project-item-content-tags {
    display: flex;
    gap: 8px;
    margin-top: 12px;
}

.project-item-content-tag {
    border: 1px solid var(--primary-color);
    padding: 5px 10px;
    border-radius: 30px;
    font-size: 12px;
    text-transform: uppercase;
    font-weight: 500;
}
</style>
