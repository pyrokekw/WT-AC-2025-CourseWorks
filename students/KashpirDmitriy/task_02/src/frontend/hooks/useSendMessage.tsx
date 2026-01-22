'use client'

import { useCallback, useState } from 'react'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'
import type { ChatMessage, SendMessagePayload } from '@/types/message'

const API_URL = process.env.NEXT_PUBLIC_API_URI

export function useSendMessage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (payload: SendMessagePayload): Promise<ChatMessage | null> => {
      if (!API_URL) {
        setError('API url is not configured')
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
        const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

        const body = {
          ...payload,
          created: payload.created ?? new Date().toISOString(),
        }

        const res = await fetch(`${API_URL}/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && tokenType
              ? { Authorization: `${tokenType} ${token}` }
              : {}),
          },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          let message = 'Failed to send message'
          try {
            const errData = await res.json()
            if (errData?.detail) message = errData.detail
          } catch {}
          throw new Error(message)
        }

        const data: ChatMessage = await res.json()
        return data
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to send message')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { sendMessage, loading, error }
}
