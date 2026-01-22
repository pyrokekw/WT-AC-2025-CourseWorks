<script setup lang="ts">
const emit = defineEmits<{
    (e: 'click', event: MouseEvent): void
}>()

const props = withDefaults(
    defineProps<{
        type?: 'button' | 'submit' | 'reset'
        variant?: 'sm' | 'lg' | ''
        disabled?: boolean
    }>(),
    {
        type: 'button',
        variant: '',
        disabled: false,
    }
)

const onClick = (e: MouseEvent) => {
    if (props.disabled) return
    emit('click', e)
}
</script>

<template>
    <button
        :class="['btn', variant && `btn-${variant}`, $attrs.class]"
        :type="props.type"
        :disabled="props.disabled"
        @click="onClick"
    >
        <slot />
    </button>
</template>

<style scoped>
.btn {
    min-width: 170px;
    text-transform: uppercase;
    font-size: 16px;
    font-weight: 500;
    border: 1px solid var(--primary-color);
    border-radius: 50px;
    padding: 17px 30px;
    transition-property: background-color, color, box-shadow, transform;
    transition-duration: 200ms;
    transition-timing-function: linear;
}

.btn-sm {
    min-width: 120px;
    font-size: 14px;
    padding: 10px 20px;
    border-width: 2px;
    font-weight: 700;
}

@media (hover: hover) and (pointer: fine) {
    .btn:hover {
        background-color: var(--primary-color);
        color: var(--light-color);
        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
    }
}

@media (hover: none) and (pointer: coarse) {
    .btn:active {
        background-color: var(--primary-color);
        color: var(--light-color);
        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
        /* transform: scale(0.9); */
    }
}
</style>
