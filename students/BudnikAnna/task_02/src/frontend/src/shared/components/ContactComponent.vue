<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

import AppInput from '@/shared/ui/AppInput.vue'
import AppTextarea from '../ui/AppTextarea.vue'
import AppButton from '../ui/AppButton.vue'
import AppError from '../ui/AppError.vue'
import AppSuccess from '../ui/AppSuccess.vue'

import type { ApiResponse } from '@/shared/types/'
import { env } from '@/shared/config/env'

const props = withDefaults(
    defineProps<{
        restrictResize?: boolean
    }>(),
    {
        restrictResize: false,
    }
)

type ContactDto = {
    id: string
    name: string
    email: string
    message?: string
    createdAt: string
}

const name = ref<string>('')
const email = ref<string>('')
const message = ref<string>('')

const loading = ref<boolean>(false)
const error = ref<string>('')
const success = ref<string>('')

let infoTimer: ReturnType<typeof setTimeout> | null = null

function clearInfoTimer() {
    if (infoTimer) {
        clearTimeout(infoTimer)
        infoTimer = null
    }
}

function hideInfoAfter(ms = 3000) {
    clearInfoTimer()
    infoTimer = setTimeout(() => {
        error.value = ''
        success.value = ''
        infoTimer = null
    }, ms)
}

onBeforeUnmount(() => {
    clearInfoTimer()
})

async function handleSubmit() {
    if (loading.value) return

    clearInfoTimer()

    loading.value = true
    error.value = ''
    success.value = ''

    try {
        const normalizedName = name.value.trim()
        const normalizedEmail = email.value.trim().toLowerCase()
        const normalizedMessage = message.value.trim()

        if (!normalizedName || !normalizedEmail) {
            throw new Error('name and email are required')
        }

        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            throw new Error('email is invalid')
        }

        const payload: { name: string; email: string; message?: string } = {
            name: normalizedName,
            email: normalizedEmail,
        }

        if (normalizedMessage) {
            payload.message = normalizedMessage
        }

        const res = await fetch(`${env.API_URL}/api/contacts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })

        const json: ApiResponse<{ contact: ContactDto }> = await res.json()

        if (!json.success) {
            throw new Error(json.message)
        }

        success.value = json.message || 'Contact request created'

        name.value = ''
        email.value = ''
        message.value = ''

        hideInfoAfter(5000)
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Fetch Error'
        error.value = msg

        hideInfoAfter(5000)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <form class="contact-form" @submit.prevent="handleSubmit">
        <AppInput
            id="contact-form-field-name"
            name="contact-form-name"
            placeholder="your name"
            label="Name"
            wrapper-class="contact-field"
            v-model="name"
            :disabled="loading"
        />

        <AppInput
            id="contact-form-field-email"
            name="contact-form-email"
            placeholder="your email"
            label="Email"
            type="email"
            wrapper-class="contact-field"
            v-model="email"
            :disabled="loading"
        />

        <AppTextarea
            id="contact-form-field-message"
            name="contact-form-message"
            placeholder="your message"
            label="Message"
            wrapper-class="contact-field"
            :textarea-class="restrictResize ? 'restict-textarea-resize' : ''"
            v-model="message"
            :disabled="loading"
        />

        <div class="contact-form-info-block">
            <AppError v-if="error">
                {{ error }}
            </AppError>

            <AppSuccess v-if="success">
                {{ success }}
            </AppSuccess>
        </div>

        <AppButton type="submit" :disabled="loading">
            {{ loading ? 'sending...' : 'submit' }}
        </AppButton>
    </form>
</template>

<style scoped>
.contact-form {
    max-width: 720px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
}

.contact-field {
    width: 100%;
}

.contact-form-status {
    font-size: 14px;
    line-height: 1.4;
}

.contact-form-info-block {
    height: 20px;
    line-height: 20px;
}
</style>
