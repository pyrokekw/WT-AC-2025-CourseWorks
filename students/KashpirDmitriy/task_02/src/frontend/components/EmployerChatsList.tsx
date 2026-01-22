'use client'

import Link from 'next/link'
import {
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { useChats } from '@/hooks/useChats'

export function EmployerChatsList() {
  const { items, loading, error, refetch } = useChats()

  return (
    <Card sx={{ mt: 3, borderRadius: 3, boxShadow: 3 }}>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6">Мои чаты</Typography>
          <Button variant="outlined" onClick={refetch} disabled={loading}>
            Обновить
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* можно убрать, но полезно для проверки */}
        <Typography variant="caption" color="text.secondary">
          Получено чатов: {items.length}
        </Typography>

        {loading ? (
          <Typography sx={{ mt: 1 }} color="text.secondary">
            Загрузка...
          </Typography>
        ) : error ? (
          <Typography sx={{ mt: 1 }} color="error">
            {error}
          </Typography>
        ) : items.length === 0 ? (
          <Typography sx={{ mt: 1 }} color="text.secondary">
            Чатов пока нет.
          </Typography>
        ) : (
          <Stack spacing={1.5} sx={{ mt: 1.5 }}>
            {items.map((chat) => (
              <Stack
                key={chat.id}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  p: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Stack spacing={0.25}>
                  <Typography variant="subtitle1">Чат #{chat.id}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    employmentId: {chat.employmentId} • workerId:{' '}
                    {chat.workerId}
                  </Typography>
                </Stack>

                <Button
                  component={Link}
                  href={`/chats/${chat.id}`}
                  variant="contained"
                  size="small"
                >
                  Открыть
                </Button>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
