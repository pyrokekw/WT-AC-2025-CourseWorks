// components/AuthGate.tsx
'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const setUser = useUserStore((state) => state.setUser)
  const clearUser = useUserStore((state) => state.clearUser)
  const setLoaded = useUserStore((state) => state.setLoaded)

  useEffect(() => {
    if (!pathname) return

    setLoaded(false)

    const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
    const tokenType = localStorage.getItem('token_type')
    const isAuth = Boolean(token && tokenType)
    const isAuthPage = pathname.startsWith('/auth')

    if (isAuth) {
      const rawUser = localStorage.getItem('user')
      if (rawUser) {
        try {
          const parsedUser = JSON.parse(rawUser)
          setUser(parsedUser)
        } catch (e) {
          console.error('Ошибка парсинга user из localStorage', e)
          clearUser()
        }
      } else {
        clearUser()
      }
    } else {
      clearUser()
    }

    if (!isAuth && !isAuthPage) {
      router.replace('/auth/login')
      return
    }

    console.log('isAuth', isAuth)

    if (isAuth && isAuthPage) {
      router.replace('/')
      return
    }

    setLoaded(true)
  }, [pathname, router, setUser, clearUser, setLoaded])

  return <>{children}</>
}
