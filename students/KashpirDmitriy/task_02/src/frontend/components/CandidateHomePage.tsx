'use client'

import Link from 'next/link'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'

import { CandidateResume } from './CandidateResume'
import { useResumeStore } from '@/store/useResumeStore'
import { useUserStore } from '@/store/useUserStore'
import { useMyApplications } from '@/hooks/useMyApplications'
import { EmployerChatsList } from './EmployerChatsList'

export function CandidateHomePage() {
  const resume = useResumeStore((state) => state.resume)
  const user = useUserStore((s) => s.user)

  const {
    applications,
    loading: appsLoading,
    error: appsError,
    refetch: refetchApps,
  } = useMyApplications(Boolean(user?.id))

  return (
    <div className="flex flex-col gap-11">
      <CandidateResume />

      <EmployerChatsList />

      <Box>
        <Paper sx={{ p: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
          >
            <Box>
              <Typography variant="h6">Мои отклики</Typography>
              <Typography variant="body2" color="text.secondary">
                История ваших откликов на вакансии
              </Typography>
            </Box>

            <Button onClick={refetchApps} disabled={!user?.id || appsLoading}>
              Обновить
            </Button>
          </Stack>

          <Box mt={2}>
            {!user?.id && (
              <Alert severity="info">
                Войдите в аккаунт, чтобы видеть список откликов.
              </Alert>
            )}

            {appsLoading && (
              <Stack alignItems="center" sx={{ py: 2 }}>
                <CircularProgress size={22} />
              </Stack>
            )}

            {appsError && <Alert severity="error">{appsError}</Alert>}

            {!appsLoading &&
              user?.id &&
              !appsError &&
              applications.length === 0 && (
                <Alert severity="warning">У вас пока нет откликов.</Alert>
              )}

            {!appsLoading && !appsError && applications.length > 0 && (
              <Stack spacing={2}>
                {applications.map((app, idx) => {
                  const shortMsg =
                    app.message.length > 140
                      ? `${app.message.slice(0, 140)}…`
                      : app.message

                  return (
                    <Box key={app.ApplicationId}>
                      {idx > 0 && <Divider sx={{ mb: 2 }} />}

                      <Stack spacing={0.5}>
                        <Typography fontWeight={600}>
                          Вакансия #{app.jobId}
                        </Typography>

                        <Typography variant="body2" color="text.secondary">
                          {new Date(app.creationTime).toLocaleString()}
                        </Typography>

                        <Typography variant="body2">{shortMsg}</Typography>

                        <Box>
                          <Button
                            size="small"
                            component={Link}
                            href={`/jobs/${app.jobId}`}
                          >
                            Открыть вакансию
                          </Button>
                        </Box>
                      </Stack>
                    </Box>
                  )
                })}
              </Stack>
            )}
          </Box>
        </Paper>
      </Box>

      <Box mb={3}>
        <Paper
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6">Ищете подходящие вакансии?</Typography>
            <Typography variant="body2" color="text.secondary">
              Перейдите к списку всех доступных вакансий и откликайтесь сразу из
              личного кабинета.
            </Typography>
          </Box>

          {resume ? (
            <Button variant="contained" component={Link} href="/jobs">
              Перейти к вакансиям
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Сначала заполните резюме
            </Typography>
          )}
        </Paper>
      </Box>
    </div>
  )
}
