'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'

import { useJob } from '@/hooks/useJob'
import { useApplyToJob } from '@/hooks/useApplyToJob'
import { useMyApplications } from '@/hooks/useMyApplications'
import { useUserStore } from '@/store/useUserStore'
import { useResume } from '@/hooks/useResume'

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>()
  const { job, loading, error } = useJob(params?.id)

  const user = useUserStore((s) => s.user)

  const jobId = useMemo(() => {
    const n = Number(params?.id)
    return Number.isFinite(n) ? n : 0
  }, [params?.id])

  const {
    resume,
    loading: resumeLoading,
    error: resumeError,
    fetchResume,
  } = useResume(user?.id)

  const { apply, loading: applyLoading, error: applyError } = useApplyToJob()

  const {
    getByJobId,
    refetch: refetchApps,
    loading: appsLoading,
  } = useMyApplications(Boolean(user?.id))
  const existingApplication = useMemo(
    () => getByJobId(jobId),
    [getByJobId, jobId]
  )

  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const canOpen = Boolean(jobId)

  const handleOpen = async () => {
    setSuccess(null)
    setLocalError(null)
    setText('')
    setOpen(true)

    if (!user?.id) {
      setLocalError('Нужно войти в аккаунт')
      return
    }

    const r = await fetchResume()
    if (!r) setLocalError('Сначала создайте резюме')
  }

  const handleSend = async () => {
    setSuccess(null)
    setLocalError(null)

    const trimmed = text.trim()
    if (!trimmed) return setLocalError('Напишите сообщение')
    if (!user?.id) return setLocalError('Нужно войти в аккаунт')
    if (!jobId) return setLocalError('Некорректный id вакансии')
    if (resumeLoading) return

    const ensuredResume = resume ?? (await fetchResume())
    if (!ensuredResume?.id) {
      setLocalError('Сначала создайте резюме')
      return
    }

    await apply({
      resumeId: user.id,
      jobId,
      text: trimmed,
    })

    await refetchApps()
    setSuccess('Отклик отправлен')
    setOpen(false)
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress />
        </Stack>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!job) return null

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack spacing={2}>
        {success && <Alert severity="success">{success}</Alert>}

        <Typography variant="h4" fontWeight={700}>
          {job.name}
        </Typography>

        <Typography color="text.secondary">
          Компания: {job.company.title} • {job.company.city}
        </Typography>

        <Typography color="text.secondary">
          З/П: {job.salary} • Опыт: {job.workExperience}
        </Typography>

        <Typography color="text.secondary">
          {job.workSchedule}, {job.workShift} • {job.workHours}ч •{' '}
          {job.remote ? 'удалёнка' : job.hybrid ? 'гибрид' : 'офис'}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {job.skills.map((s) => (
            <Chip key={s} size="small" label={s} />
          ))}
        </Stack>

        <Typography variant="caption" color="text.secondary">
          {new Date(job.created_at).toLocaleString()}
        </Typography>

        {existingApplication ? (
          <Alert severity="success">
            Вы уже откликнулись на эту вакансию{' '}
            {existingApplication.creationTime
              ? `(${new Date(
                  existingApplication.creationTime
                ).toLocaleString()})`
              : ''}
          </Alert>
        ) : (
          <Button
            variant="contained"
            size="large"
            onClick={handleOpen}
            disabled={!canOpen || appsLoading}
          >
            Откликнуться
          </Button>
        )}
      </Stack>

      <Dialog
        open={open}
        onClose={() => !applyLoading && !resumeLoading && setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Отклик на вакансию</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {(localError || applyError || resumeError) && (
              <Alert severity="error">
                {localError || applyError || resumeError}
              </Alert>
            )}

            {resumeLoading && (
              <Alert severity="info" icon={<CircularProgress size={18} />}>
                Проверяем наличие резюме на сервере…
              </Alert>
            )}

            <TextField
              label="Сообщение работодателю"
              placeholder="Напишите короткое сопроводительное сообщение…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              multiline
              minRows={4}
              autoFocus
              disabled={applyLoading}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setOpen(false)}
            disabled={applyLoading || resumeLoading}
          >
            Отмена
          </Button>

          <Button
            variant="contained"
            onClick={handleSend}
            disabled={
              applyLoading ||
              resumeLoading ||
              !text.trim() ||
              !user?.id ||
              !jobId ||
              !resume?.id
            }
            startIcon={
              applyLoading ? <CircularProgress size={18} /> : undefined
            }
          >
            Отправить
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
