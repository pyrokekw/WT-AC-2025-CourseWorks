<script setup lang="ts">
import { onBeforeUnmount, onMounted, watch } from 'vue'
import XMarkIcon from '../assets/icons/XMarkIcon.vue'

const props = withDefaults(
    defineProps<{
        open: boolean
        closeOnOverlay?: boolean
        closeOnEsc?: boolean
    }>(),
    {
        closeOnOverlay: true,
        closeOnEsc: true,
    }
)

const emit = defineEmits<{
    (e: 'update:open', value: boolean): void
}>()

const close = () => emit('update:open', false)

const onOverlayClick = () => {
    if (props.closeOnOverlay) close()
}

const onKeydown = (e: KeyboardEvent) => {
    if (!props.open) return
    if (props.closeOnEsc && e.key === 'Escape') close()
}

watch(
    () => props.open,
    (v) => {
        document.body.style.overflow = v ? 'hidden' : ''
    }
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
})
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div v-if="open" class="overlay" @click="onOverlayClick">
                <div class="modal" role="dialog" aria-modal="true" @click.stop>
                    <button class="close" type="button" @click="close">
                        <XMarkIcon />
                    </button>

                    <slot />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.overlay {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: var(--overlay-color);
    padding: 20px 8px;
    overflow-y: auto;
    z-index: 9999;
}

.modal {
    max-width: 560px;
    width: 100%;
    background: var(--light-color);
    border-radius: 18px;
    padding: 20px;
    position: relative;
}

.close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    position: absolute;
    top: 20px;
    right: 20px;
    background: transparent;
    fill: var(--primary-color);
    cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 160ms linear;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
