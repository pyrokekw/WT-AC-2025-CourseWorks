<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useModalStore } from '@/stores/modal'
import { useAuthStore } from '@/stores/auth'
import AppButton from '../ui/AppButton.vue'
import AppInput from '../ui/AppInput.vue'
import AppError from '../ui/AppError.vue'

const props = defineProps<{ payload?: { email?: string } }>()

const modal = useModalStore()
const auth = useAuthStore()

const form = reactive({
    name: '',
    email: '',
    password: '',
})

const error = reactive({
    message: '',
})

watch(
    () => props.payload?.email,
    (email) => {
        if (email && !form.email) form.email = email
    },
    { immediate: true }
)

async function onSubmit() {
    error.message = ''

    try {
        await auth.register({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
        })

        modal.close()
    } catch (e) {
        error.message = e instanceof Error ? e.message : 'Register error'
    }
}

function goToLogin() {
    modal.open('login', { email: form.email.trim() })
}
</script>

<template>
    <div class="content">
        <h3 class="title">Register</h3>

        <form class="register-form" @submit.prevent="onSubmit">
            <AppInput
                v-model="form.name"
                id="register-name"
                name="name"
                autocomplete="username"
                label="Your Name"
                type="text"
                placeholder="Enter Name"
            />
            <AppInput
                v-model="form.email"
                id="register-email"
                name="email"
                autocomplete="email"
                label="Email"
                type="email"
                placeholder="Enter email"
            />
            <AppInput
                v-model="form.password"
                id="register-password"
                name="password"
                autocomplete="current-password"
                label="Password"
                type="password"
                placeholder="Enter password"
            />

            <AppError>{{ error.message }}</AppError>

            <div class="register-form-controls">
                <AppButton type="submit" :disabled="auth.isLoading">
                    {{ auth.isLoading ? 'Loading...' : 'Sign up' }}
                </AppButton>
            </div>
        </form>
        <p class="hint">
            Already have an account?
            <button type="button" class="hint-link" @click="goToLogin">Log in</button>
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

.register-form {
    display: flex;
    flex-direction: column;
    row-gap: 20px;
    margin-top: 20px;
}

.register-form-controls {
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
