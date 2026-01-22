import type { RouteLocationRaw } from 'vue-router'
import { useModalStore } from '@/stores/modal'

export type NavAppearance = 'link' | 'button'
export type NavVisibility = 'always' | 'auth' | 'guest' | 'admin'

export type NavItem =
    | {
          id: string
          label: string
          appearance: 'link'
          to: RouteLocationRaw
          visibility: NavVisibility
          preventNav?: boolean
      }
    | {
          id: string
          label: string
          appearance: 'button'
          onClick: (e: MouseEvent) => void
          visibility: NavVisibility
          preventNav?: boolean
      }

export const navigation: NavItem[] = [
    {
        id: 'home',
        label: 'Home',
        to: '/',
        appearance: 'link',
        visibility: 'always',
    },
    {
        id: 'collections',
        label: 'Collections',
        to: '/collections',
        appearance: 'link',
        visibility: 'always',
    },
    {
        id: 'admin',
        label: 'Admin',
        to: '/admin',
        appearance: 'link',
        visibility: 'admin',
    },
    {
        id: 'login',
        label: 'LogIn',
        appearance: 'button',
        visibility: 'guest',
        onClick: () => {
            const modal = useModalStore()
            modal.open('login')
        },
    },
    {
        id: 'logout',
        label: 'Logout',
        appearance: 'button',
        visibility: 'auth',
        onClick: () => {
            const modal = useModalStore()
            modal.open('logout')
        },
    },
]
