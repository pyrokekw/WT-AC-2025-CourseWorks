'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Job } from '@/types/job'
import type { Company } from '@/types/company'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'

const API_URL = process.env.NEXT_PUBLIC_API_URI

export type JobWithCompany = Omit<Job, 'companyId'> & { company: Company }

export function useJob(jobId?: number | string) {
  const [job, setJob] = useState<JobWithCompany | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJob = useCallback(async () => {
    if (jobId === undefined || jobId === null || jobId === '') {
      setJob(null)
      return
    }

    const idNum = typeof jobId === 'string' ? Number(jobId) : jobId
    if (!Number.isFinite(idNum)) {
      setError('Invalid job id')
      setJob(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (!API_URL) throw new Error('NEXT_PUBLIC_API_URI is not defined')

      const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
      const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && tokenType
          ? { Authorization: `${tokenType} ${token}` }
          : {}),
      }

      const jobPromise = fetch(`${API_URL}/jobs/${idNum}`, { headers }).then(
        async (res) => {
          if (!res.ok) {
            throw new Error('Failed to fetch job')
          }

          return res.json() as Promise<Job>
        }
      )

      const companyPromise = jobPromise.then((job) =>
        fetch(`${API_URL}/companies/${job.companyId}`, { headers }).then(
          async (res) => {
            if (!res.ok) {
              throw new Error('Failed to fetch company')
            }

            return res.json() as Promise<Company>
          }
        )
      )

      const [jobData, companyData] = await Promise.all([
        jobPromise,
        companyPromise,
      ])

      const { companyId: _, ...rest } = jobData

      setJob({ ...rest, company: companyData })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setJob(null)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    fetchJob()
  }, [fetchJob])

  return { job, loading, error, refetch: fetchJob }
}
