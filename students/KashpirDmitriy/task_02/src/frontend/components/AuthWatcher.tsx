'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'

export default function AuthWatcher() {
  const router = useRouter()
  const pathname = usePathname()

  const setUser = useUserStore((state) => state.setUser)

  useEffect(() => {
    if (!pathname) return

    const token = localStorage.getItem('token')
    const tokenType = localStorage.getItem('token_type')
    const isAuth = Boolean(token && tokenType)

    if (isAuth) {
      const userRaw = localStorage.getItem('user')

      if (userRaw) {
        try {
          const parsedUser = JSON.parse(userRaw)
          setUser(parsedUser)
        } catch (e) {
          console.error('Не удалось распарсить user из localStorage', e)
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } else {
      setUser(null)
    }

    const isAuthPage = pathname.startsWith('/auth')

    if (!isAuth && !isAuthPage) {
      router.replace('/auth/login')
      return
    }

    if (isAuth && isAuthPage) {
      router.replace('/')
      return
    }
  }, [pathname, router, setUser])

  return null
}
