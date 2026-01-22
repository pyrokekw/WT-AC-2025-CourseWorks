import type { RouteLocationRaw } from 'vue-router'

export type ModalKey = 'hireMe' | 'contact'

export type HeaderAction =
    | { type: 'route'; to: RouteLocationRaw }
    | { type: 'anchor'; href: `#${string}` }
    | { type: 'external'; href: string; target?: '_blank' | '_self' }
    | { type: 'modal'; key: ModalKey }

export type HeaderNavItem = {
    id: string
    label: string
    action: HeaderAction
}

export const headerNav: HeaderNavItem[] = [
    {
        id: 'work',
        label: 'WORK',
        action: {
            type: 'anchor',
            href: '#work',
        },
    },
    {
        id: 'about',
        label: 'ABOUT ME',
        action: {
            type: 'anchor',
            href: '#about',
        },
    },
    {
        id: 'blog',
        label: 'BLOG',
        action: {
            type: 'route',
            to: { name: 'home' },
        },
    },
    {
        id: 'contact',
        label: 'CONTACT',
        action: {
            type: 'modal',
            key: 'contact',
        },
    },
]

export const headerCta = {
    label: 'HIRE ME',
    action: {
        type: 'modal',
        key: 'hireMe',
    } as const,
}
