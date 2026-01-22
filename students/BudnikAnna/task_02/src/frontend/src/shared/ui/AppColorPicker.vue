<script setup lang="ts">
import { computed } from 'vue'

const HEX_COLOR_REGEX = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/

function normalizeHex(value: string) {
    const v = value.trim()
    if (!v) return ''
    return v.startsWith('#') ? v : `#${v}`
}

function toColorInputValue(value: string) {
    const v = normalizeHex(value)
    if (!HEX_COLOR_REGEX.test(v)) return '#000000'

    if (v.length === 4) {
        // #RGB -> #RRGGBB
        const r = v[1]
        const g = v[2]
        const b = v[3]
        return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
    }

    return v.toLowerCase()
}

const props = withDefaults(
    defineProps<{
        id: string
        name?: string
        label?: string
        disabled?: boolean
        placeholder?: string
        modelValue?: string
    }>(),
    {
        id: '',
        name: '',
        label: '',
        disabled: false,
        placeholder: '#AABBCC or #ABC',
        modelValue: '',
    }
)

const emit = defineEmits<{
    (e: 'update:modelValue', v: string): void
}>()

const preview = computed(() => toColorInputValue(props.modelValue))

function onHexInput(e: Event) {
    const value = (e.target as HTMLInputElement).value
    emit('update:modelValue', value)
}

function onPick(e: Event) {
    const value = (e.target as HTMLInputElement).value
    emit('update:modelValue', value)
}
</script>

<template>
    <div class="app-color-picker">
        <label v-if="props.label" class="app-color-picker-label" :for="props.id">
            {{ props.label }}
        </label>

        <div class="app-color-picker-row">
            <input
                class="app-color-picker-picker"
                type="color"
                :id="`${props.id}-picker`"
                :name="props.name"
                :disabled="props.disabled"
                :value="preview"
                @input="onPick"
            />

            <!-- Hex поле -->
            <input
                class="app-color-picker-hex"
                type="text"
                :id="props.id"
                :name="props.name"
                :disabled="props.disabled"
                :placeholder="props.placeholder"
                :value="props.modelValue"
                @input="onHexInput"
            />
        </div>

        <p class="app-color-picker-hint">Format: #AABBCC or #ABC</p>
    </div>
</template>

<style scoped>
.app-color-picker {
    display: block;
    width: 100%;
}

.app-color-picker-label {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 8px;
}

.app-color-picker-row {
    display: grid;
    grid-template-columns: 56px 1fr;
    gap: 12px;
    align-items: center;
}

.app-color-picker-picker {
    width: 56px;
    height: 56px;
    padding: 0;
    border: 1px solid var(--input-border-color);
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
    overflow: hidden;
    transition: border-color 0.2s ease;
}

.app-color-picker-picker:focus {
    outline: none;
    border-color: var(--input-border-focus-color);
}

.app-color-picker-picker::-webkit-color-swatch-wrapper {
    padding: 10px;
}

.app-color-picker-picker::-webkit-color-swatch {
    border: 0;
    border-radius: 12px;
}

.app-color-picker-picker::-moz-color-swatch {
    border: 0;
    border-radius: 12px;
}

.app-color-picker-hex {
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
    background: transparent;
    color: inherit;
}

.app-color-picker-hex:focus {
    outline: none;
    border-color: var(--input-border-focus-color);
}

.app-color-picker-hex:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.app-color-picker-swatch {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.14);
}

.app-color-picker-hint {
    margin: 8px 0 0;
    font-size: 12px;
    opacity: 0.65;
}

@media (max-width: 760px) {
    .app-color-picker-row {
        grid-template-columns: 56px 1fr;
    }

    .app-color-picker-swatch {
        display: none;
    }
}
</style>
