import type { Component } from 'vue'

import InstagramIcon from '@/shared/assets/icons/InstagramIcon.vue'
import LinkedinIcon from '@/shared/assets/icons/LinkedinIcon.vue'
import TelegramIcon from '@/shared/assets/icons/TelegramIcon.vue'
import XTwitterIcon from '@/shared/assets/icons/XTwitterIcon.vue'

interface SocialItem {
    title: string
    color: string
    href: string
    icon: Component
}

export const socials: SocialItem[] = [
    {
        title: 'LinkedIn',
        color: '#1869ff',
        href: 'https://www.linkedin.com/',
        icon: LinkedinIcon,
    },
    {
        title: 'Instagram',
        color: '#e51a68',
        href: 'https://instagram.com/',
        icon: InstagramIcon,
    },
    {
        title: 'Telegram',
        color: '#007bb6',
        href: 'https://telegram.org/',
        icon: TelegramIcon,
    },
    {
        title: 'X',
        color: '#000',
        href: 'https://x.com/',
        icon: XTwitterIcon,
    },
]
