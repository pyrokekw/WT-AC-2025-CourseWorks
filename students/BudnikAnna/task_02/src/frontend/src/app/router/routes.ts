import type { RouteRecordRaw } from 'vue-router'

import CollectionsLayout from '../layout/CollectionsLayout.vue'

import HomePage from '@/pages/HomePage'
import CollectionPage from '@/pages/CollectionPage/'
import NotFoundPage from '@/pages/NotFoundPage/'
import CollectionsPage from '@/pages/CollectionsPage/'

import AdminPage from '@/pages/admin/AdminPage/'
import UsersPage from '@/pages/admin/UsersPage/'
import TagsPage from '@/pages/admin/TagsPage/'
import ProjectsPage from '@/pages/admin/ProjectsPage/'
import AdminCollectionsPage from '@/pages/admin/CollectionsPage/'
import AdminContactsPage from '@/pages/admin/ContactsPage'
import AdminContactPage from '@/pages/admin/ContactPage'

export const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'home',
        component: HomePage,
    },
    {
        path: '/collections',
        component: CollectionsLayout,
        children: [
            {
                path: '',
                name: 'collections',
                component: CollectionsPage,
            },
            {
                path: ':id',
                name: 'single-collection',
                component: CollectionPage,
                props: true,
            },
        ],
    },

    {
        path: '/admin',
        component: AdminPage,
        meta: { requiresAdmin: true },
        children: [
            { path: '', redirect: { name: 'admin-users' } },

            {
                path: 'users',
                name: 'admin-users',
                component: UsersPage,
            },
            {
                path: 'tags',
                name: 'admin-tags',
                component: TagsPage,
            },
            {
                path: 'projects',
                name: 'admin-projects',
                component: ProjectsPage,
            },
            {
                path: 'collections',
                name: 'admin-collections',
                component: AdminCollectionsPage,
            },
            {
                path: 'contacts',
                name: 'admin-contacts',
                component: AdminContactsPage,
            },
            {
                path: 'contacts/:id',
                name: 'admin-contact',
                component: AdminContactPage,
                props: true,
            },
        ],
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'not-found',
        component: NotFoundPage,
    },
]
