<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
    <div class="app-wrapper">
        <div class="app-admin-header">
            <nav class="app-admin-header-navigation">
                <ul class="app-admin-header-navigation-list">
                    <li class="app-header-navigation-list-item">
                        <RouterLink class="app-admin-header-navigation-link" to="/admin/users/">
                            Show users
                        </RouterLink>
                    </li>
                    <li class="app-header-navigation-list-item">
                        <RouterLink class="app-admin-header-navigation-link" to="/admin/tags/">
                            Show tags
                        </RouterLink>
                    </li>
                    <li class="app-header-navigation-list-item">
                        <RouterLink class="app-admin-header-navigation-link" to="/admin/projects/">
                            Show Projects
                        </RouterLink>
                    </li>
                    <li class="app-header-navigation-list-item">
                        <RouterLink
                            class="app-admin-header-navigation-link"
                            to="/admin/collections/"
                        >
                            Show Collections
                        </RouterLink>
                    </li>
                    <li class="app-header-navigation-list-item">
                        <RouterLink class="app-admin-header-navigation-link" to="/admin/contacts/">
                            Show Contacts
                        </RouterLink>
                    </li>
                </ul>
            </nav>
        </div>

        <RouterView />
    </div>
</template>

<style scoped>
.app-admin-header {
    padding: 20px 0;
}

.app-admin-header-navigation-list {
    display: flex;
    align-items: center;
    column-gap: 40px;
}

.app-admin-header-navigation-link {
    font-weight: 700;
    font-size: 14px;
    text-transform: uppercase;
    position: relative;
}

.app-admin-header-navigation-link.router-link-active::after {
    width: 100%;
}

.app-admin-header-navigation-link:hover::after {
    width: 100%;
}

.app-admin-header-navigation-link::after {
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
</style>
