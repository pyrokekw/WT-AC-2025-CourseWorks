'use client'

import { useState } from 'react'
import { Button, type ButtonProps } from '@mui/material'
import { useRouter } from 'next/navigation'
import { useCreateChat } from '@/hooks/useCreateChat'

type Props = ButtonProps & {
  employmentId?: number
  workerId?: number
  existingChatId?: number
}

export function CreateChatButton({
  employmentId,
  workerId,
  existingChatId,
  children,
  ...props
}: Props) {
  const router = useRouter()
  const { createChat, loading } = useCreateChat()
  const [localError, setLocalError] = useState<string | null>(null)

  const isMissing = employmentId == null || workerId == null

  const handleClick = async () => {
    if (isMissing) return

    // ✅ если чат уже есть — просто открываем
    if (existingChatId != null) {
      router.push(`/chats/${existingChatId}`)
      return
    }

    setLocalError(null)

    const chat = await createChat({ employmentId, workerId })

    if (!chat?.id) {
      setLocalError('Не удалось создать чат')
      return
    }

    router.push(`/chats/${chat.id}`)
  }

  return (
    <>
      <Button
        {...props}
        onClick={handleClick}
        disabled={props.disabled || loading || isMissing}
      >
        {loading ? 'Создаю чат...' : children ?? 'Написать'}
      </Button>

      {localError ? (
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          {localError}
        </div>
      ) : null}
    </>
  )
}
