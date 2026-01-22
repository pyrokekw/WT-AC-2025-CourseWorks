'use client'

import { useCallback, useEffect, useState } from 'react'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'
import type { Chat } from '@/types/chat'

const API_URL = process.env.NEXT_PUBLIC_API_URI

export function useChats() {
  const [items, setItems] = useState<Chat[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChats = useCallback(async () => {
    if (!API_URL) return

    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
      const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

      const res = await fetch(`${API_URL}/chats`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && tokenType
            ? { Authorization: `${tokenType} ${token}` }
            : {}),
        },
      })

      if (!res.ok) {
        let message = 'Failed to fetch chats'
        try {
          const errData = await res.json()
          if (errData?.detail) message = errData.detail
        } catch {}
        throw new Error(message)
      }

      const data: Chat[] = await res.json()
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch chats')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchChats()
  }, [fetchChats])

  return { items, loading, error, refetch: fetchChats }
}
