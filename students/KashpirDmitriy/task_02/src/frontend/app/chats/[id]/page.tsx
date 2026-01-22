'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useChatMessages } from '@/hooks/useChatMessages'
import { useSendMessage } from '@/hooks/useSendMessage'
import { useUserStore } from '@/store/useUserStore'
import { Loader } from '@/components/Loader'

function formatDate(input?: string) {
  if (!input) return ''
  const d = new Date(input)
  return isNaN(d.getTime()) ? input : d.toLocaleString()
}

export default function ChatPage() {
  const params = useParams<{ id: string }>()
  const idParam = params?.id
  const id = Array.isArray(idParam) ? idParam[0] : idParam

  const userId = useUserStore((s) => s.user?.id)

  const chatId = useMemo(() => {
    const n = Number(id)
    return Number.isFinite(n) ? n : undefined
  }, [id])

  const { items, loading, error, refetch } = useChatMessages(chatId)
  const { sendMessage, loading: sending, error: sendError } = useSendMessage()

  const [text, setText] = useState('')

  const handleSend = async () => {
    if (chatId == null || userId == null) return
    const trimmed = text.trim()
    if (!trimmed) return

    const res = await sendMessage({
      senderId: userId,
      chatId,
      text: trimmed,
    })

    if (res) {
      setText('')
      refetch()
    }
  }

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Чат #{id}</Typography>
        <Button onClick={refetch} variant="outlined" disabled={loading}>
          Обновить
        </Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Loader />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : items.length === 0 ? (
          <Typography color="text.secondary">Сообщений пока нет.</Typography>
        ) : (
          <Stack spacing={1}>
            {items.map((m) => {
              const isMine = userId != null && m.senderId === userId
              return (
                <Box
                  key={m.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                    gap: 0.25,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '80%',
                      px: 1.5,
                      py: 1,
                      borderRadius: 2,
                      bgcolor: isMine
                        ? 'action.selected'
                        : 'background.default',
                      border: '1px solid',
                      borderColor: 'divider',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <Typography variant="body2">{m.text}</Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    {m.senderId} • {formatDate(m.created)}
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={1}>
          <TextField
            label="Сообщение"
            value={text}
            onChange={(e) => setText(e.target.value)}
            multiline
            minRows={2}
            disabled={userId == null || chatId == null || sending}
          />

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={
                userId == null || chatId == null || sending || !text.trim()
              }
            >
              {sending ? 'Отправка...' : 'Отправить'}
            </Button>
          </Stack>

          {sendError ? (
            <Typography variant="caption" color="error">
              {sendError}
            </Typography>
          ) : null}
        </Stack>
      </Paper>
    </Box>
  )
}
