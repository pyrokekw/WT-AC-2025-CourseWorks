<script setup lang="ts">
import { computed } from 'vue'
import AppModal from '@/shared/components/AppModal.vue'
import { useModalStore } from '@/stores/modal'
import { modalRegistry } from '@/shared/config/modal-registry'

const modal = useModalStore()

const Current = computed(() => (modal.name ? modalRegistry[modal.name] : null))

const openProxy = computed({
    get: () => modal.isOpen,
    set: (v: boolean) => {
        if (!v) modal.close()
    },
})
</script>

<template>
    <AppModal v-model:open="openProxy">
        <component :is="Current" :payload="modal.payload" />
    </AppModal>
</template>
