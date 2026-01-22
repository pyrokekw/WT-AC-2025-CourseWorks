import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from '@/app/router'
import { useAuthStore } from '@/stores/auth'

import './styles/index.css'

const pinia = createPinia()
const app = createApp(App)

const authStore = useAuthStore(pinia)

app.use(router)
app.use(pinia)

authStore.bootstrap()

app.mount('#app')
