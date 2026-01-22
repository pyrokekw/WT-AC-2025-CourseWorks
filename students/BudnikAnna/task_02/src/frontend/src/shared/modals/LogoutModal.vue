<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modal'

import AppButton from '@/shared/ui/AppButton.vue'
import AppError from '@/shared/ui/AppError.vue'

const auth = useAuthStore()
const modal = useModalStore()

const error = ref('')

function onConfirm() {
    error.value = ''
    try {
        auth.logout?.()
        modal.close()
    } catch (e) {
        error.value = e instanceof Error ? e.message : 'Logout error'
    }
}

function onCancel() {
    modal.close()
}
</script>

<template>
    <div class="content">
        <h3 class="title">Log Out</h3>

        <p class="text">
            Are you sure you want to log out
            <span v-if="auth.user?.email">({{ auth.user.email }})</span>?
        </p>

        <AppError v-if="error" :message="error" />

        <div class="actions">
            <AppButton variant="sm" @click="onCancel"> Cancel </AppButton>

            <AppButton variant="sm" @click="onConfirm"> Confirm </AppButton>
        </div>
    </div>
</template>

<style scoped>
.content {
    padding-top: 24px;
}

.title {
    font-size: 24px;
    font-weight: 700;
}

.text {
    margin-top: 12px;
    color: var(--secondary-color);
}

.actions {
    margin-top: 16px;
    display: flex;
    gap: 12px;
}
</style>
