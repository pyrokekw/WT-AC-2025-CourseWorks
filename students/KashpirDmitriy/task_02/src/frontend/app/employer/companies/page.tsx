'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CompanyFormWithList } from '@/components/CompanyFormWithList'
import { useUserStore } from '@/store/useUserStore'

export default function HomePage() {
  const router = useRouter()

  const user = useUserStore((state) => state.user)
  const isLoaded = useUserStore((state) => state.isLoaded)

  useEffect(() => {
    if (!isLoaded) return

    if (!user || user.role !== 'employer') {
      router.replace('/')
    }
  }, [isLoaded, user, router])

  if (!isLoaded || !user || user.role !== 'employer') {
    return null
  }

  return (
    <div className="wrapper py-10">
      <CompanyFormWithList />
    </div>
  )
}
