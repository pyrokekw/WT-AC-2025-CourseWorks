'use client'

import { useCallback, useState } from 'react'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'
import type { Chat, ChatCreatePayload } from '@/types/chat'

const API_URL = process.env.NEXT_PUBLIC_API_URI

export function useCreateChat() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createChat = useCallback(
    async (payload: ChatCreatePayload): Promise<Chat | null> => {
      if (!API_URL) {
        setError('API url is not configured')
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
        const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

        const res = await fetch(`${API_URL}/chats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && tokenType
              ? { Authorization: `${tokenType} ${token}` }
              : {}),
          },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          let message = 'Failed to create chat'
          try {
            const errData = await res.json()
            if (errData?.detail) message = errData.detail
          } catch {
            // ignore json parse errors
          }
          throw new Error(message)
        }

        const data: Chat = await res.json()
        return data
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { createChat, loading, error }
}
