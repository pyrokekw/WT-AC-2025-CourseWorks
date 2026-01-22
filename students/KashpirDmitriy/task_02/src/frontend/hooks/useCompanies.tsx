'use client'

import { useEffect, useState } from 'react'
import { SKILL_VALUES } from '@/constants/skills'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'

const API_URL = process.env.NEXT_PUBLIC_API_URI

export type BusinessAreaCode = (typeof SKILL_VALUES)[number]

export type CompanyPayload = {
  title: string
  city: string
  businessAreas: BusinessAreaCode[]
}

export type Company = CompanyPayload & {
  id: number
  userid: number
}

export function useCompanies(userId?: number) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId || !API_URL) return

    const fetchCompanies = async () => {
      setLoading(true)
      setError(null)

      try {
        const token =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
            : null
        const tokenType =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE) ??
              'Bearer'
            : 'Bearer'

        const res = await fetch(`${API_URL}/users/${userId}/companies`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
          },
        })

        if (!res.ok) {
          throw new Error('Не удалось загрузить компании')
        }

        const data: Company[] = await res.json()
        setCompanies(data)
      } catch (err) {
        console.error(err)
        setError(
          err instanceof Error ? err.message : 'Ошибка при загрузке компаний'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [userId])

  const createCompany = async (
    payload: CompanyPayload
  ): Promise<Company | null> => {
    if (!API_URL) {
      console.error('NEXT_PUBLIC_API_URI is not defined')
      setError('API url не сконфигурирован')
      return null
    }

    if (!userId) {
      setError('Неизвестен пользователь')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const token =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
          : null
      const tokenType =
        typeof window !== 'undefined'
          ? window.localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE) ??
            'Bearer'
          : 'Bearer'

      const res = await fetch(`${API_URL}/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Не удалось создать компанию')
      }

      const created: Company = await res.json()

      setCompanies((prev) => [...prev, created])

      return created
    } catch (err) {
      console.error(err)
      setError(
        err instanceof Error ? err.message : 'Ошибка при создании компании'
      )
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    companies,
    loading,
    error,
    createCompany,
  }
}
