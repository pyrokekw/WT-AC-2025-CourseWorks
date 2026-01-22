<script setup lang="ts">
import AppHeader from '@/shared/components/AppHeader.vue'
import AppFooter from '@/shared/components/AppFooter.vue'
</script>

<template>
    <div class="app-root">
        <AppHeader />

        <main class="app-main">
            <slot />
        </main>

        <AppFooter />
    </div>
</template>

<style scope>
.app-root {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
}
.app-main {
    flex: 1;
    padding-bottom: 60px;
}
</style>
