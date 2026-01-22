'use client'

import { useCallback, useEffect, useState } from 'react'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'

const API_URL = process.env.NEXT_PUBLIC_API_URI

export type ApplicationItem = {
  resumeId: number
  jobId: number
  message: string
  ApplicationId: number
  creationTime: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function readError(res: Response): Promise<string> {
  try {
    const data: unknown = await res.json()
    if (isRecord(data)) {
      const detail = data.detail
      const message = data.message
      if (typeof detail === 'string') return detail
      if (typeof message === 'string') return message
    }
    return 'Request failed'
  } catch {
    return 'Request failed'
  }
}

function isApplicationItem(value: unknown): value is ApplicationItem {
  return (
    isRecord(value) &&
    typeof value.resumeId === 'number' &&
    typeof value.jobId === 'number' &&
    typeof value.message === 'string' &&
    typeof value.ApplicationId === 'number' &&
    typeof value.creationTime === 'string'
  )
}

export function useMyApplications(enabled: boolean) {
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchApplications = useCallback(async () => {
    if (!enabled) return
    if (!API_URL) {
      setError('API url is not configured')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
      const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

      const res = await fetch(`${API_URL}/applications/user`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && tokenType
            ? { Authorization: `${tokenType} ${token}` }
            : {}),
        },
      })

      if (!res.ok) {
        throw new Error(await readError(res))
      }

      const data: unknown = await res.json()

      if (!Array.isArray(data)) {
        throw new Error('Unexpected applications response format')
      }

      const valid = data.filter(isApplicationItem)
      setApplications(valid)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось получить отклики')
      setApplications([])
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void fetchApplications()
  }, [fetchApplications])

  const getByJobId = useCallback(
    (jobId: number) => applications.find((a) => a.jobId === jobId) ?? null,
    [applications]
  )

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
    getByJobId,
  }
}
