<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import { profile } from '@/shared/config/profile'
import { navigation } from '@/shared/config/navigation'
import { useAuthStore } from '@/stores/auth'

import AppButton from '@/shared/ui/AppButton.vue'
import XMarkIcon from '../assets/icons/XMarkIcon.vue'
import BarsIcon from '../assets/icons/BarsIcon.vue'

const auth = useAuthStore()
const menuOpen = ref(false)

const openMenu = () => {
    menuOpen.value = true
}

const closeMenu = () => {
    menuOpen.value = false
}

const onOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) closeMenu()
}

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
    <header class="app-header">
        <div class="app-wrapper">
            <div class="app-header-content">
                <RouterLink class="app-header-author" to="/">
                    <div class="app-header-author-name">
                        {{ profile.firstName }}<br />
                        {{ profile.lastName }}
                    </div>
                    <div class="app-header-author-profession">
                        {{ profile.profession }}
                    </div>
                </RouterLink>

                <div
                    class="app-header-overlay"
                    :class="{ open: menuOpen }"
                    @click="onOverlayClick"
                />

                <button class="app-header-response-menu-open" type="button" @click="openMenu">
                    <BarsIcon />
                </button>

                <div class="app-header-response-menu" :class="{ open: menuOpen }">
                    <button class="app-header-response-menu-close" type="button" @click="closeMenu">
                        <XMarkIcon />
                    </button>

                    <nav class="app-header-navigation">
                        <ul class="app-header-navigation-list">
                            <li class="app-header-navigation-list-item" v-for="item in navItems">
                                <RouterLink
                                    class="app-header-navigation-link"
                                    :to="item.to"
                                    v-if="item.appearance === 'link'"
                                >
                                    {{ item.label }}
                                </RouterLink>
                                <AppButton
                                    v-if="item.appearance === 'button'"
                                    variant="sm"
                                    @click="item.onClick"
                                >
                                    {{ item.label }}
                                </AppButton>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    </header>
</template>

<style scoped>
.app-header {
    padding: 20px 0;
}

.app-header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.app-header-author-name {
    font-size: 16px;
    font-weight: 700;
}

.app-header-author-profession {
    font-size: 12px;
    font-weight: 400;

    color: var(--secondary-color);

    margin-top: 8px;
}

.app-header-navigation-list {
    display: flex;
    align-items: center;
    column-gap: 40px;
}

.app-header-navigation-link {
    font-weight: 700;
    font-size: 14px;
    text-transform: uppercase;
    position: relative;
}

.app-header-navigation-link.router-link-active::after {
    width: 100%;
}

.app-header-navigation-link.router-link-exact-active::after {
    width: 100%;
}

.app-header-navigation-link::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -5px;
    width: 0;
    height: 3px;
    background-color: var(--primary-color);
    transition-property: width;
    transition-duration: 300ms;
    transition-timing-function: ease;
}

.app-header-overlay {
    display: none;
}

.app-header-response-menu-close {
    display: none;
}

.app-header-response-menu-open {
    display: none;
}

@media (hover: hover) and (pointer: fine) {
    .app-header-navigation-link:hover::after {
        width: 100%;
    }
}

@media (hover: none) and (pointer: coarse) {
    .app-header-navigation-link:active::after {
        opacity: 100%;
    }
}

@media (max-width: 950px) {
    .app-header-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100dvh;
        background-color: var(--overlay-color);
        display: block;
        visibility: hidden;
        opacity: 0;
        z-index: 200;
        transition-property: visibility, opacity;
        transition-duration: 300ms;
        transition-timing-function: ease;
    }

    .app-header-overlay.open {
        visibility: visible;
        opacity: 100%;
    }

    .app-header-response-menu {
        max-width: 320px;
        width: 100%;
        height: 100dvh;
        padding: 40px 20px;
        position: fixed;
        right: 0;
        top: 0;
        background-color: var(--light-color);
        transform: translateX(100%);
        z-index: 300;
        transition-property: transform;
        transition-duration: 300ms;
        transition-timing-function: ease;
    }

    .app-header-response-menu.open {
        transform: translateX(0);
    }

    .app-header-navigation-list {
        flex-direction: column;
        row-gap: 12px;
    }

    .app-header-navigation-list-item {
        width: 100%;
        text-align: center;
    }

    .app-header-navigation-link {
        display: block;
        width: 100%;
        font-size: 16px;
        padding: 10px 12px;
        opacity: 20%;
    }

    .app-header-navigation-link.router-link-active {
        opacity: 100%;
    }

    .app-header-navigation-link.router-link-exact-active {
        opacity: 100%;
    }

    .app-header-navigation-link::after {
        display: none;
    }

    .app-header-navigation-link.router-link-active::after {
        display: none;
    }

    .app-header-navigation-link.router-link-exact-active::after {
        display: none;
    }

    .app-header-response-menu-open {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        top: 20px;
        right: 20px;
        background: transparent;
        fill: var(--primary-color);
        cursor: pointer;
        z-index: 255;
    }

    .app-header-response-menu-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        position: fixed;
        top: 20px;
        right: 20px;
        background: transparent;
        fill: var(--primary-color);
        cursor: pointer;
        z-index: 255;
    }
}
</style>
