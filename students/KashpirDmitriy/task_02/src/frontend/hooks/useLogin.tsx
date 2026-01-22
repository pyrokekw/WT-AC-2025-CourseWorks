import { useState } from 'react'
import type { LoginPayload, LoginResponse } from '@/types/auth'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'

const API_URL = process.env.NEXT_PUBLIC_API_URI

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (data: LoginPayload): Promise<LoginResponse | null> => {
    if (!API_URL) {
      console.error('NEXT_PUBLIC_API_URI is not defined')
      setError('API url is not configured')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        let message = 'Failed to login'

        const errData = await res.json()

        if (errData?.detail) {
          message = errData.detail
        }

        throw new Error(message)
      }

      const result: LoginResponse = await res.json()

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          LOCAL_STORAGE_ITEMS.ACCESS_TOKEN,
          result.access_token
        )
        localStorage.setItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE, result.token_type)
        localStorage.setItem(
          LOCAL_STORAGE_ITEMS.USER,
          JSON.stringify(result.user)
        )
      }

      return result
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'

      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    login,
  }
}
