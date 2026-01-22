'use client'

import { useCallback, useEffect, useState } from 'react'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'
import type { Job } from '@/types/job'

export type JobWithMeta = Job & {
  created_at?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URI

export type EmbeddedResume = {
  id: number
  userid: number
  title: string
  language: string[]
  skills: string[]
  description: string
  workExperience: number
}

export type EmployerApplication = {
  application_id: number
  applicant_id: number
  applicant_name: string
  applicant_email: string
  message: string
  creation_time: string
  resume: EmbeddedResume | null
}

export type EmployerJobAppliedItem = {
  job: JobWithMeta
  application_count: number
  applications: EmployerApplication[]
}

type Options = {
  enabled?: boolean
}

export function useEmployerJobsApplied(options: Options = {}) {
  const { enabled = true } = options

  const [items, setItems] = useState<EmployerJobAppliedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchApplied = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) return

      if (!API_URL) {
        setError('API url is not configured')
        return
      }

      const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
      const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

      if (!token || !tokenType) {
        setError('Not authenticated')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`${API_URL}/employer/jobs/applied`, {
          method: 'GET',
          signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `${tokenType} ${token}`,
          },
        })

        if (!res.ok) {
          let message = 'Failed to fetch employer jobs with applications'
          try {
            const errData = await res.json()
            if (errData?.detail) message = errData.detail
          } catch {}
          throw new Error(message)
        }

        const data: EmployerJobAppliedItem[] = await res.json()
        setItems(Array.isArray(data) ? data : [])
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === 'string'
            ? e
            : typeof e === 'object' && e !== null && 'message' in e
            ? String((e as { message: unknown }).message)
            : ''

        const aborted =
          (e instanceof DOMException && e.name === 'AbortError') ||
          (e instanceof Error && e.name === 'AbortError') ||
          msg.toLowerCase().includes('aborted')

        if (aborted) return

        const message = msg || 'Unknown error'
        setError(message)
      } finally {
        setLoading(false)
      }
    },
    [enabled]
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchApplied(controller.signal)
    return () => controller.abort()
  }, [fetchApplied])

  return {
    items,
    loading,
    error,
    refetch: () => fetchApplied(),
    setItems,
  }
}
