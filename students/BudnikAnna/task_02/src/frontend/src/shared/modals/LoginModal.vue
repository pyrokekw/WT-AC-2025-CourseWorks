<script setup lang="ts">
import { reactive } from 'vue'
import { useModalStore } from '@/stores/modal'
import { useAuthStore } from '@/stores/auth'
import AppButton from '../ui/AppButton.vue'
import AppInput from '../ui/AppInput.vue'
import AppError from '../ui/AppError.vue'

defineProps<{ payload?: unknown }>()

const modal = useModalStore()
const auth = useAuthStore()

const form = reactive({
    email: '',
    password: '',
})

const error = reactive({
    message: '',
})

async function onSubmit() {
    error.message = ''

    try {
        await auth.login({
            email: form.email.trim(),
            password: form.password,
        })

        modal.close()
    } catch (e) {
        error.message = e instanceof Error ? e.message : 'Login error'
    }
}

function goToRegister() {
    modal.open('register', { email: form.email.trim() })
}
</script>

<template>
    <div class="content">
        <h3 class="title">Login</h3>

        <form class="login-form" @submit.prevent="onSubmit">
            <AppInput
                v-model="form.email"
                id="login-email"
                name="email"
                autocomplete="email"
                label="Email"
                type="email"
                placeholder="Enter email"
            />
            <AppInput
                v-model="form.password"
                id="login-password"
                name="password"
                autocomplete="current-password"
                label="Password"
                type="password"
                placeholder="Enter password"
            />

            <AppError>{{ error.message }}</AppError>

            <div class="login-form-controls">
                <AppButton type="submit" :disabled="auth.isLoading">
                    {{ auth.isLoading ? 'Loading...' : 'Log In' }}
                </AppButton>
            </div>
        </form>
        <p class="hint">
            Don’t have an account?
            <button type="button" class="hint-link" @click="goToRegister">Sign up</button>
        </p>
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

.login-form {
    display: flex;
    flex-direction: column;
    row-gap: 20px;
    margin-top: 20px;
}

.login-form-controls {
    margin-top: 13px;
}

.hint {
    text-align: center;
    margin-top: 30px;
    font-size: 14px;
}

.hint-link {
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    text-decoration: underline;
    font: inherit;
    font-weight: 700;
}
</style>
