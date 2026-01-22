'use client'

import { useCallback, useState } from 'react'
import type { Resume, ResumePayload } from '@/types/resume'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'

const API_URL = process.env.NEXT_PUBLIC_API_URI

export const useResume = (userId?: number) => {
  const [resume, setResume] = useState<Resume | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchResume = useCallback(async () => {
    if (!API_URL || !userId) return

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
      const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

      const res = await fetch(`${API_URL}/resumes/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && tokenType
            ? { Authorization: `${tokenType} ${token}` }
            : {}),
        },
      })

      if (res.status === 404) {
        setResume(null)
        return
      }

      if (!res.ok) {
        throw new Error('Не удалось получить резюме')
      }

      const data: Resume = await res.json()
      setResume(data)

      return data
    } catch (e) {
      console.error(e)
      setError(
        e instanceof Error ? e.message : 'Произошла ошибка при загрузке резюме'
      )
    } finally {
      setLoading(false)
    }
  }, [userId])

  const createResume = useCallback(async (payload: ResumePayload) => {
    if (!API_URL) {
      setError('API url is not configured')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
      const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

      const res = await fetch(`${API_URL}/resumes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && tokenType
            ? { Authorization: `${tokenType} ${token}` }
            : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Не удалось создать резюме')
      }

      const data: Resume = await res.json()
      setResume(data)
      return data
    } catch (e) {
      console.error(e)
      setError(
        e instanceof Error ? e.message : 'Произошла ошибка при создании резюме'
      )
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { resume, loading, error, createResume, fetchResume }
}
