'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader } from '@/components/Loader'
import { useUserStore } from '@/store/useUserStore'
import { Box, Paper, Typography, Stack } from '@mui/material'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const isLoaded = useUserStore((s) => s.isLoaded)

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    if (!user) {
      router.replace('/auth/login')
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return <Loader />
  }

  return (
    <main className="wrapper">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          pt: { xs: 4, md: 8 },
          pb: { xs: 4, md: 8 },
        }}
      >
        {children}

        <Box
          sx={{
            mt: { xs: 4, md: 6 },
          }}
        >
          <Typography variant="h6" mb={2}>
            Эта платформа позволяет:
          </Typography>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Paper variant="outlined" sx={{ p: 2, flex: 1, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Соискателям
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Создавай профиль, откликайся на вакансии, отслеживай статус
                откликов и находи первую работу по специальности.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, flex: 1, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Работодателям
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Публикуй вакансии, фильтруй кандидатов по опыту и навыкам,
                быстро находи подходящих студентов и выпускников.
              </Typography>
            </Paper>
          </Stack>
        </Box>
      </Box>
    </main>
  )
}
