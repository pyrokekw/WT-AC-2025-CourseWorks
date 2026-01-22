'use client'

import Link from 'next/link'
import {
  Alert,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Container,
  MenuItem,
  Select,
  Stack,
  Typography,
  Pagination,
} from '@mui/material'

import { useJobs } from '@/hooks/useJobs'
import { Loader } from '@/components/Loader'

export default function JobsPage() {
  const {
    jobs,
    loading,
    error,
    limit,
    page,
    totalPages,
    total,
    setLimit,
    setOffset,
  } = useJobs({ initialLimit: 10 })

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h4" fontWeight={600}>
          Вакансии
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            На странице:
          </Typography>

          <Select
            size="small"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <MenuItem key={n} value={n}>
                {n}
              </MenuItem>
            ))}
          </Select>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: 'auto' }}
          >
            Всего: {total}
          </Typography>
        </Stack>

        {loading && <Loader />}

        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && jobs.length === 0 && (
          <Alert severity="info">Пока нет вакансий</Alert>
        )}

        <Stack spacing={2}>
          {jobs.map((job) => (
            <Card key={job.id} variant="outlined">
              <CardActionArea component={Link} href={`/jobs/${job.id}`}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" gap={2}>
                    <Stack spacing={0.5}>
                      <Typography variant="h6" fontWeight={600}>
                        {job.name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        З/П: {job.salary} • Опыт: {job.workExperience}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        {job.workSchedule}, {job.workShift} • {job.workHours}ч •{' '}
                        {job.remote
                          ? 'удалёнка'
                          : job.hybrid
                          ? 'гибрид'
                          : 'офис'}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                        mt={1}
                      >
                        {job.skills.map((s) => (
                          <Chip key={s} size="small" label={s} />
                        ))}
                      </Stack>
                    </Stack>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {new Date(job.created_at).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>

        <Stack alignItems="center" sx={{ pt: 1 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setOffset((p - 1) * limit)}
          />
        </Stack>
      </Stack>
    </Container>
  )
}
