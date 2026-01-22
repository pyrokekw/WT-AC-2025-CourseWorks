import { defineStore } from 'pinia'
import type { ModalName } from '@/shared/config/modal-registry'

export const useModalStore = defineStore('modal', {
    state: () => ({
        name: null as ModalName | null,
        payload: null as unknown,
    }),

    getters: {
        isOpen: (s) => s.name !== null,
    },

    actions: {
        open(name: ModalName, payload?: unknown) {
            this.name = name
            this.payload = payload ?? null
        },
        close() {
            this.name = null
            this.payload = null
        },
    },
})
