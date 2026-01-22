import { useState } from 'react'
import type { RegisterPayload, RegisterResponse } from '@/types/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URI

export function useRegister() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const register = async (
    data: RegisterPayload
  ): Promise<RegisterResponse | null> => {
    if (!API_URL) {
      console.error('NEXT_PUBLIC_API_URI is not defined')
      setError('API url is not configured')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        let message = 'Failed to register'

        const errData = await res.json()

        if (errData?.detail) {
          message = errData.detail
        }

        throw new Error(message)
      }

      const result: RegisterResponse = await res.json()

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
    register,
  }
}
