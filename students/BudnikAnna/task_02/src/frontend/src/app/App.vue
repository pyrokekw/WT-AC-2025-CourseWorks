<script setup>
import ModalHost from '@/shared/components/ModalHost.vue'
import MainLayout from './layout/MainLayout.vue'
</script>

<template>
    <main-layout>
        <router-view />
        <ModalHost />
    </main-layout>
</template>

<style scoped></style>
