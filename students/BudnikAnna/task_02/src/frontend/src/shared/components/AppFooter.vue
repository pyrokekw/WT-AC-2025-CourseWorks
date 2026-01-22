<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { navigation } from '@/shared/config/navigation'
import { useAuthStore } from '@/stores/auth'
import { socials } from '@/shared/config/social'

import AppButton from '@/shared/ui/AppButton.vue'

const auth = useAuthStore()
const year = new Date().getFullYear()

const navItems = computed(() => {
    if (!auth.isReady) {
        return navigation.filter((i) => i.visibility === 'always')
    }

    const isAuth = !!auth.user
    const isAdmin = auth.user?.role === 'admin'

    return navigation.filter((item) => {
        const visibility = item.visibility || 'always'

        if (visibility === 'guest') {
            return !isAuth
        }

        if (visibility === 'auth') {
            return isAuth
        }

        if (visibility === 'admin') {
            return isAuth && isAdmin
        }

        return true
    })
})
</script>

<template>
    <footer class="app-footer">
        <div class="app-wrapper">
            <div class="app-footer-content">
                <div class="app-footer-content-info">&copy; {{ year }}</div>

                <div class="app-footer-social">
                    <a
                        v-for="(item, index) in socials"
                        :key="`footer-social-${index}`"
                        :href="item.href"
                        :title="item.title"
                        class="app-footer-social-item"
                        target="_blank"
                    >
                        <div class="app-footer-social-item-content">
                            <component :is="item.icon" class="app-footer-social-icon" />
                        </div>
                    </a>
                </div>

                <nav class="app-footer-navigation">
                    <ul class="app-footer-navigation-list">
                        <li class="app-footer-navigation-list-item" v-for="item in navItems">
                            <RouterLink
                                class="app-footer-navigation-link"
                                :to="item.to"
                                v-if="item.appearance === 'link'"
                            >
                                {{ item.label }}
                            </RouterLink>
                            <AppButton
                                v-if="item.appearance === 'button'"
                                variant="sm"
                                class="app-footer-button"
                                @click="item.onClick"
                            >
                                {{ item.label }}
                            </AppButton>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.app-footer {
    background-color: var(--primary-color);
    color: var(--footer-primary-color);
    padding: 16px 0;
}

.app-footer-content {
    display: flex;
    align-items: center;
}

.app-footer-content-info {
    padding-right: 14px;
    border-right: 1px solid var(--footer-primary-color);
    margin-right: 14px;
}

.app-footer-social {
    display: flex;
    gap: 16px;
}

.app-footer-social-item {
    width: 24px;
    height: 24px;
    fill: var(--footer-primary-color);
    transition: fill 0.2s linear;
}

.app-footer-social-item:hover {
    width: 24px;
    height: 24px;
    fill: var(--footer-primary-hover-color);
}

.app-footer-navigation {
    margin-left: auto;
}

.app-footer-navigation-list {
    display: flex;
    align-items: center;
    column-gap: 20px;
    font-size: 14px;
}

.app-footer-navigation-link {
    font-weight: 600;
    color: var(--footer-primary-color);
    transition: color 0.2s linear;
}

.app-footer-navigation-link:hover {
    color: var(--footer-primary-hover-color);
}

.app-footer-button {
    font-weight: 600;
    font-size: 14px;
    min-width: auto;
    border-color: var(--footer-primary-color);
}

.app-footer-button:hover {
    box-shadow: none;
    color: var(--primary-color);
    background-color: var(--footer-primary-color);
}

@media (max-width: 525px) {
    .app-footer-content {
        flex-direction: column;
    }

    .app-footer-content-info {
        width: 100%;
        text-align: center;
        padding-right: 0;
        border-right: none;
        border-bottom: 1px solid var(--footer-primary-color);
        margin: 0;
        padding-bottom: 14px;
        margin-bottom: 14px;
    }

    .app-footer-social {
        margin-bottom: 32px;
    }

    .app-footer-navigation {
        margin-left: 0;
    }

    .app-footer-navigation-list {
        flex-direction: column;
        font-size: 16px;
        row-gap: 10px;
    }

    .app-footer-navigation-link {
        display: block;
        padding: 10px 20px;
    }
}
</style>
