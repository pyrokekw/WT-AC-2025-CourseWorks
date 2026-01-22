'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Job } from '@/types/job'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'

const API_URL = process.env.NEXT_PUBLIC_API_URI

type UseJobsParams = {
  initialLimit?: number
  initialOffset?: number
}

export function useJobs(params?: UseJobsParams) {
  const [limit, setLimitState] = useState(params?.initialLimit ?? 10)
  const [offset, setOffset] = useState(params?.initialOffset ?? 0)

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const total = jobs.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const page = Math.floor(offset / limit) + 1

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      if (!API_URL) {
        throw new Error('NEXT_PUBLIC_API_URI is not defined')
      }

      const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
      const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

      const res = await fetch(`${API_URL}/jobs`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && tokenType
            ? { Authorization: `${tokenType} ${token}` }
            : {}),
        },
      })

      if (!res.ok) {
        throw new Error('Failed to fetch jobs')
      }

      const data: Job[] = await res.json()
      setJobs(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'

      setError(message)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  const canPrev = offset > 0
  const canNext = jobs.length === limit

  const prevPage = () => setOffset((v) => Math.max(0, v - limit))
  const nextPage = () => setOffset((v) => v + limit)

  const setLimit = (v: number) => {
    setOffset(0)
    setLimitState(v)
  }

  return {
    jobs,
    loading,
    error,

    limit,
    offset,
    page,
    totalPages,
    total,

    setLimit,
    setOffset,
    refetch: fetchJobs,

    canPrev,
    canNext,
    prevPage,
    nextPage,
  }
}
