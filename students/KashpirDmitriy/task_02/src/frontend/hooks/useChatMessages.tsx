'use client'

import { useCallback, useEffect, useState } from 'react'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'
import type { ChatMessage } from '@/types/message'

const API_URL = process.env.NEXT_PUBLIC_API_URI

export function useChatMessages(chatId?: number) {
  const [items, setItems] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!API_URL || chatId == null) return

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
      const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

      const res = await fetch(`${API_URL}/chats/${chatId}/messages`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && tokenType
            ? { Authorization: `${tokenType} ${token}` }
            : {}),
        },
      })

      if (res.status === 404) {
        setItems([])
        return
      }

      if (!res.ok) {
        let message = 'Failed to fetch messages'
        try {
          const errData = await res.json()
          if (errData?.detail) message = errData.detail
        } catch {}
        throw new Error(message)
      }

      const data: ChatMessage[] = await res.json()

      // на всякий случай сортируем по времени
      data.sort(
        (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
      )

      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [chatId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  return { items, loading, error, refetch: fetchMessages }
}
