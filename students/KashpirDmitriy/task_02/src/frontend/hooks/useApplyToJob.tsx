'use client'

import { useCallback, useState } from 'react'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'

const API_URL = process.env.NEXT_PUBLIC_API_URI

type ApplyInput = {
  resumeId: number
  jobId: number
  text: string
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

export function useApplyToJob() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apply = useCallback(async (input: ApplyInput) => {
    if (!API_URL) {
      const msg = 'NEXT_PUBLIC_API_URI is not defined'
      setError(msg)
      throw new Error(msg)
    }

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
      const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && tokenType
          ? { Authorization: `${tokenType} ${token}` }
          : {}),
      }

      const res = await fetch(`${API_URL}/applications`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resumeId: input.resumeId,
          jobId: input.jobId,
          message: input.text,
        }),
      })

      if (!res.ok) throw new Error(await readError(res))

      const application: unknown = await res.json()
      return application
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to apply'
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  return { apply, loading, error }
}
