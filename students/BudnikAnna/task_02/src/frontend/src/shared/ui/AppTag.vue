<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        name: string
        color: string
    }>(),
    {
        name: '',
        color: '#111',
    }
)
</script>

<template>
    <div class="app-tag" :style="`border-color: ${color}`">
        {{ name }}
    </div>
</template>

<style scoped>
.app-tag {
    border: 1px solid var(--primary-color);
    padding: 5px 10px;
    border-radius: 30px;
    font-size: 12px;
    text-transform: uppercase;
    font-weight: 500;
}
</style>
