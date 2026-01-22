'use client'

import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import { Job } from '@/types/job'

type JobListProps = {
  jobs: Job[]
  loading: boolean
  error: string | null
}

export const EmployerJobList = ({ jobs, loading, error }: JobListProps) => {
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        Мои вакансии
      </Typography>

      {loading && (
        <Typography variant="body2" color="text.secondary">
          Загружаем вакансии...
        </Typography>
      )}

      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && !error && jobs.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Вы ещё не создали ни одной вакансии.
        </Typography>
      )}

      {!loading && !error && jobs.length > 0 && (
        <Stack spacing={2} sx={{ mt: 2 }}>
          {jobs.map((job) => (
            <Card key={job.id} variant="outlined">
              <CardContent>
                <Typography variant="h6" component="h3">
                  {job.name}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  Зарплата: {job.salary ? `${job.salary} ₽` : 'не указана'}
                </Typography>

                <Typography variant="body2" sx={{ mb: 1 }}>
                  График: {job.workSchedule} • Смена: {job.workShift} •{' '}
                  {job.workHours || 0} ч/нед
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ flexWrap: 'wrap', mb: 1 }}
                >
                  {job.remote && <Chip label="Удалённая" size="small" />}
                  {job.hybrid && <Chip label="Гибрид" size="small" />}
                </Stack>

                {job.skills?.length > 0 && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Навыки:</strong> {job.skills.join(', ')}
                  </Typography>
                )}

                {job.language?.length > 0 && (
                  <Typography variant="body2">
                    <strong>Языки:</strong> {job.language.join(', ')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  )
}
