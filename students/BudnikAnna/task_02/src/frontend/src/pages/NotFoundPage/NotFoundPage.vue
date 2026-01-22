<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
    <div class="app-wrapper not-found">
        <h1 class="not-found-title">Page not found</h1>
        <RouterLink to="/" class="not-found-link">Go Home</RouterLink>
    </div>
</template>

<style scoped>
.not-found {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    height: 100%;
}

.not-found-title {
    font-size: 34px;
    text-transform: uppercase;
    text-align: center;
    font-weight: 700;
}

.not-found-link {
    margin-top: 12px;
    text-decoration: underline;
}
</style>
