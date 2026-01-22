<script setup lang="ts">
type SelectOption<T = string | number> = {
    label: string
    value: T
    disabled?: boolean
}

const props = withDefaults(
    defineProps<{
        id: string
        name?: string
        placeholder?: string
        disabled?: boolean
        label?: string
        options: readonly SelectOption[]
        modelValue?: string | number
        modelModifiers?: {
            number?: boolean
        }
    }>(),
    {
        id: '',
        name: '',
        placeholder: '',
        disabled: false,
        label: '',
        modelValue: '',
        modelModifiers: () => ({}),
    }
)

const emit = defineEmits<{
    (e: 'update:modelValue', v: string | number): void
}>()

function onChange(e: Event) {
    const el = e.target as HTMLSelectElement
    const opt = el.selectedOptions?.[0] as any

    let value: any = opt?._value ?? el.value

    if (props.modelModifiers?.number) {
        value = Number(value)
    }

    emit('update:modelValue', value)
}
</script>

<template>
    <div class="app-select-wrapper">
        <label v-if="props.label" class="app-select-label" :for="props.id">
            {{ props.label }}
        </label>

        <select
            class="app-select-field"
            :id="props.id"
            :name="props.name"
            :disabled="props.disabled"
            :value="props.modelValue"
            @change="onChange"
        >
            <option v-if="props.placeholder" disabled value="">
                {{ props.placeholder }}
            </option>

            <option
                v-for="opt in props.options"
                :key="String(opt.value)"
                :value="opt.value"
                :disabled="opt.disabled"
            >
                {{ opt.label }}
            </option>
        </select>
    </div>
</template>

<style scoped>
.app-select-wrapper {
    display: block;
    width: 100%;
}

.app-select-label {
    display: inline-block;
    font-size: 12px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 8px;
}

.app-select-field {
    display: block;
    width: 100%;
    padding: 20px 27px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.2;

    border: 1px solid var(--input-border-color);
    border-radius: 29px;

    background: transparent;
    color: inherit;

    transition: border-color 0.2s ease;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
}

.app-select-field:focus {
    outline: none;
    border-color: var(--input-border-focus-color);
}

.app-select-field {
    padding-right: 44px;
    background-image:
        linear-gradient(45deg, transparent 50%, currentColor 50%),
        linear-gradient(135deg, currentColor 50%, transparent 50%);
    background-position:
        calc(100% - 22px) 50%,
        calc(100% - 16px) 50%;
    background-size:
        6px 6px,
        6px 6px;
    background-repeat: no-repeat;
    opacity: 0.95;
}

.app-select-field:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
