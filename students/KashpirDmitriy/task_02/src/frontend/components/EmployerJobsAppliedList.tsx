'use client'

import { useMemo } from 'react'
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'

import { useEmployerJobsApplied } from '@/hooks/useEmployerJobsApplied'
import { useChats } from '@/hooks/useChats'
import { useUserStore } from '@/store/useUserStore'

import { LANGUAGE_OPTIONS, type LanguageCode } from '@/constants/languages'
import { CreateChatButton } from './CreateChatButton'

function formatDate(input?: string) {
  if (!input) return ''
  const d = new Date(input)
  return isNaN(d.getTime()) ? input : d.toLocaleString()
}

const LANGUAGE_LABEL_BY_CODE = new Map<LanguageCode, string>(
  LANGUAGE_OPTIONS.map((o) => [o.value, o.label])
)

function formatLanguages(codes?: string[]) {
  if (!codes?.length) return ''
  return codes
    .map((c) => LANGUAGE_LABEL_BY_CODE.get(c as LanguageCode) ?? c)
    .join(', ')
}

export function EmployerJobsAppliedList() {
  const user = useUserStore((s) => s.user)
  const employerId = user?.id

  const { items, loading, error, refetch } = useEmployerJobsApplied()

  // подтягиваем все чаты текущего пользователя
  const { items: chats } = useChats()

  // делаем быстрый индекс: "employerId:workerId" -> chatId
  const chatIdByPair = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of chats) {
      m.set(`${c.employmentId}:${c.workerId}`, c.id)
    }
    return m
  }, [chats])

  return (
    <Box className="flex flex-col gap-3">
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6">Отклики на ваши вакансии</Typography>
        <Button onClick={refetch} variant="outlined" disabled={loading}>
          Обновить
        </Button>
      </Stack>

      {loading && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Загрузка...
          </Typography>
        </Paper>
      )}

      {error && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Paper>
      )}

      {!loading && !error && items.length === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Пока нет откликов.
          </Typography>
        </Paper>
      )}

      {items.map((item) => (
        <Paper key={item.job.id} sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              gap={2}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {item.job.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Создано: {formatDate(item.job.created_at)}
                </Typography>
              </Box>

              <Chip label={`Откликов: ${item.application_count}`} />
            </Stack>

            <Stack direction="row" gap={1} flexWrap="wrap">
              {typeof item.job.salary !== 'undefined' && (
                <Chip size="small" label={`ЗП: ${item.job.salary}`} />
              )}
              {item.job.workSchedule && (
                <Chip size="small" label={`График: ${item.job.workSchedule}`} />
              )}
              {item.job.remote && <Chip size="small" label="Удалённо" />}
              {item.job.hybrid && <Chip size="small" label="Гибрид" />}
            </Stack>

            <Divider />

            {item.applications.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Откликов нет (application_count = {item.application_count})
              </Typography>
            ) : (
              <Stack spacing={1}>
                {item.applications.map((app) => {
                  const workerId = app.resume?.userid ?? app.applicant_id

                  const existingChatId =
                    employerId != null && workerId != null
                      ? chatIdByPair.get(`${employerId}:${workerId}`)
                      : undefined

                  return (
                    <Paper
                      key={app.application_id}
                      variant="outlined"
                      sx={{ p: 1.5 }}
                    >
                      <Stack spacing={0.5}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          gap={2}
                        >
                          <Box>
                            <Typography variant="body1" fontWeight={600}>
                              {app.applicant_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {app.applicant_email}
                            </Typography>
                          </Box>

                          <Typography variant="body2" color="text.secondary">
                            {formatDate(app.creation_time)}
                          </Typography>
                        </Stack>

                        <Typography variant="body2">{app.message}</Typography>

                        {app.resume ? (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" fontWeight={700}>
                              Резюме: {app.resume.title}
                            </Typography>

                            {!!app.resume.skills?.length && (
                              <Stack
                                direction="row"
                                gap={1}
                                flexWrap="wrap"
                                sx={{ mt: 0.5 }}
                              >
                                {app.resume.skills.map((s) => (
                                  <Chip key={s} size="small" label={s} />
                                ))}
                              </Stack>
                            )}

                            {!!app.resume.language?.length && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5 }}
                              >
                                Языки: {formatLanguages(app.resume.language)}
                              </Typography>
                            )}

                            {app.resume.description && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {app.resume.description}
                              </Typography>
                            )}

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              Опыт: {app.resume.workExperience} лет
                            </Typography>
                          </Box>
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            Резюме не найдено
                          </Typography>
                        )}

                        <CreateChatButton
                          variant="contained"
                          size="small"
                          employmentId={employerId}
                          workerId={workerId}
                          existingChatId={existingChatId}
                        >
                          {existingChatId ? 'Открыть чат' : 'Написать'}
                        </CreateChatButton>
                      </Stack>
                    </Paper>
                  )
                })}
              </Stack>
            )}
          </Stack>
        </Paper>
      ))}
    </Box>
  )
}
