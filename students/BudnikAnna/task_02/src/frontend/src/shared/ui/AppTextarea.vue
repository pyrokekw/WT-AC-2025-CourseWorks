<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        id: string
        name?: string
        placeholder?: string
        disabled?: boolean
        autocomplete?: string
        label?: string
        rows?: number
        modelValue?: string
        textareaClass?: string
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
        rows: 5,
        modelValue: '',
        textareaClass: '',
        wrapperClass: '',
        labelClass: '',
    }
)

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
    <div :class="['app-textarea-wrapper', wrapperClass]">
        <label v-if="props.label" :class="['app-textarea-label', labelClass]" :for="props.id">
            {{ props.label }}
        </label>

        <textarea
            :class="['app-textarea-field', textareaClass]"
            :id="props.id"
            :name="props.name"
            :rows="props.rows"
            :disabled="props.disabled"
            :placeholder="props.placeholder"
            :autocomplete="props.autocomplete"
            :value="props.modelValue"
            @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        />
    </div>
</template>

<style scoped>
.app-textarea-wrapper {
    display: block;
    width: 100%;
}

.app-textarea-label {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 8px;
}

.app-textarea-field {
    display: block;
    width: 100%;
    padding: 20px 27px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.4;

    border: 1px solid var(--input-border-color);
    border-radius: 29px;

    transition: border-color 0.2s ease;
    background: transparent;
    color: inherit;

    resize: vertical;
}

.app-textarea-field:focus {
    outline: none;
    border-color: var(--input-border-focus-color);
}

.app-textarea-field:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
