'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { useUserStore } from '@/store/useUserStore'
import { CreateJobForm } from '@/components/CreateJobForm'
import { EmployerJobList } from '@/components/EmployerJobList'

import { Job } from '@/types/job'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'

const API_URL = process.env.NEXT_PUBLIC_API_URI

export default function HomePage() {
  const router = useRouter()

  const user = useUserStore((state) => state.user)
  const isLoaded = useUserStore((state) => state.isLoaded)

  const [jobs, setJobs] = useState<Job[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [jobsError, setJobsError] = useState<string | null>(null)

  const handleJobCreated = (job: Job) => {
    setJobs((prev) => [job, ...prev])
  }

  const loadJobs = useCallback(async () => {
    if (!API_URL || !user) return

    const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
    const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

    if (!token || !tokenType) {
      queueMicrotask(() => {
        setJobsError('Нет токена авторизации')
        setJobsLoading(false)
      })
      return
    }

    try {
      setJobsLoading(true)
      setJobsError(null)

      const res = await fetch(`${API_URL}/employer/jobs/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${tokenType} ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Не удалось загрузить вакансии')
      }

      const data = (await res.json()) as Job[]
      setJobs(data)
    } catch (e) {
      console.error(e)
      setJobsError(e instanceof Error ? e.message : 'Ошибка загрузки вакансий')
    } finally {
      setJobsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!isLoaded) return
    if (!user || user.role !== 'employer') return

    loadJobs()
  }, [isLoaded, user, loadJobs])

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
      <div className="wrapper flex flex-col gap-6 md:flex-row">
        <div className="md:w-1/2">
          <CreateJobForm onCreated={handleJobCreated} />
        </div>

        <div className="md:w-full">
          <EmployerJobList
            jobs={jobs}
            loading={jobsLoading}
            error={jobsError}
          />
        </div>
      </div>
    </div>
  )
}
