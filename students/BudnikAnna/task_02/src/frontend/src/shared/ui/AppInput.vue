<script setup lang="ts">
import { InputType, Autocomplete } from '@/shared/constants/input'

const props = withDefaults(
    defineProps<{
        id: string
        name?: string
        placeholder?: string
        disabled?: boolean
        autocomplete?: Autocomplete
        label?: string
        type?: InputType
        modelValue?: string
        inputClass?: string
        wrapperClass?: string
        labelClass?: string
    }>(),
    {
        id: '',
        name: '',
        placeholder: '',
        disabled: false,
        autocomplete: '',
        label: '',
        type: 'text',
        modelValue: '',
        inputClass: '',
        wrapperClass: '',
        labelClass: '',
    }
)

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
    <div :class="['app-input-wrapper', wrapperClass]">
        <label :class="['app-input-label', labelClass]" v-if="props.label" :for="props.id">
            {{ props.label }}
        </label>
        <input
            :class="['app-input-field', inputClass]"
            type="text"
            :id="props.id"
            :name="props.name"
            :disabled="props.disabled"
            :placeholder="props.placeholder"
            :autocomplete="props.autocomplete"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        />
    </div>
</template>

<style scoped>
.app-input-wrapper {
    display: block;
    width: 100%;
}

.app-input-label {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 8px;
}

.app-input-field {
    display: block;
    width: 100%;
    padding: 20px 27px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.2;
    border: 1px solid var(--input-border-color);
    border-radius: 29px;
    transition: border-color 0.2s ease;
}

.app-input-field:focus {
    border-color: var(--input-border-focus-color);
}
</style>
