'use client'

import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import { useUserStore } from '@/store/useUserStore'
import { LANGUAGE_OPTIONS, type LanguageCode } from '@/constants/languages'
import { SKILL_OPTIONS, type SkillCode } from '@/constants/skills'
import { WORK_SHIFT_OPTIONS } from '@/constants/workShift'
import { WORK_SCHEDULE_VALUES } from '@/constants/schedule'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'

const API_URL = process.env.NEXT_PUBLIC_API_URI

type Company = {
  id: number
  title: string
  city: string
  businessAreas: string[]
  userid: number
}

type JobFormValues = {
  companyId: number | ''
  salary: number | ''
  name: string
  workExperience: string
  workSchedule: string
  workShift: string
  workHours: number | ''
  skills: SkillCode[]
  language: LanguageCode[]
  remote: boolean
  hybrid: boolean
}

type JobResponse = {
  companyId: number
  salary: number
  name: string
  workExperience: string
  workSchedule: string
  workShift: string
  workHours: number
  skills: string[]
  language: string[]
  remote: boolean
  hybrid: boolean
  id: number
  created_at: string
}

type CreateJobFormProps = {
  onCreated?: (job: JobResponse) => void
}

export function CreateJobForm({ onCreated }: CreateJobFormProps) {
  const user = useUserStore((s) => s.user)
  const userId = user?.id

  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  const [form, setForm] = useState<JobFormValues>({
    companyId: '',
    salary: '',
    name: '',
    workExperience: '',
    workSchedule: WORK_SCHEDULE_VALUES[0],
    workShift: WORK_SCHEDULE_VALUES[0],
    workHours: '',
    skills: [],
    language: [],
    remote: false,
    hybrid: false,
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!API_URL || !userId) return

    const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
    const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

    setLoadingCompanies(true)
    setError(null)

    fetch(`${API_URL}/users/${userId}/companies`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && tokenType
          ? { Authorization: `${tokenType} ${token}` }
          : {}),
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Не удалось загрузить компании')
        }
        const data = (await res.json()) as Company[]
        setCompanies(data)
      })
      .catch((e) => {
        console.error(e)
        setError(e.message || 'Ошибка загрузки компаний')
      })
      .finally(() => {
        setLoadingCompanies(false)
      })
  }, [userId])

  const handleTextChange =
    (field: keyof JobFormValues) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | SelectChangeEvent
    ) => {
      const value = e.target.value

      // числа
      if (field === 'salary' || field === 'workHours') {
        const num = value === '' ? '' : Number(value)
        setForm((prev) => ({ ...prev, [field]: num }))
        return
      }

      if (field === 'companyId') {
        const num = value === '' ? '' : Number(value)
        setForm((prev) => ({ ...prev, companyId: num }))
        return
      }

      setForm((prev) => ({ ...prev, [field]: value }))
    }

  const handleMultiSelectChange =
    (field: 'skills' | 'language') => (e: SelectChangeEvent<string[]>) => {
      const value = e.target.value as string[]
      setForm((prev) => ({
        ...prev,
        [field]: value as SkillCode[] & LanguageCode[],
      }))
    }

  const handleCheckboxChange =
    (field: 'remote' | 'hybrid') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.checked }))
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!API_URL) {
      setError('API url не настроен')
      return
    }

    if (!userId) {
      setError('Пользователь не найден')
      return
    }

    if (!form.companyId) {
      setError('Выберите компанию')
      return
    }

    const token = localStorage.getItem(LOCAL_STORAGE_ITEMS.ACCESS_TOKEN)
    const tokenType = localStorage.getItem(LOCAL_STORAGE_ITEMS.TOKEN_TYPE)

    if (!token || !tokenType) {
      setError('Нет токена авторизации')
      return
    }

    const payload = {
      companyId: Number(form.companyId),
      salary: Number(form.salary) || 0,
      name: form.name.trim(),
      workExperience: form.workExperience.trim(),
      workSchedule: form.workSchedule,
      workShift: form.workShift,
      workHours: Number(form.workHours) || 0,
      skills: form.skills,
      language: form.language,
      remote: form.remote,
      hybrid: form.hybrid,
    }

    setSubmitting(true)
    try {
      // если у тебя другой URL, поменяй эту строку
      const res = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${tokenType} ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail || 'Не удалось создать вакансию')
      }

      const created = (await res.json()) as JobResponse
      setSuccess('Вакансия успешно создана')

      // сброс формы
      setForm((prev) => ({
        ...prev,
        salary: '',
        name: '',
        workExperience: '',
        workHours: '',
        skills: [],
        language: [],
        remote: false,
        hybrid: false,
      }))

      if (onCreated) onCreated(created)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Ошибка при создании вакансии')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Создать вакансию
      </Typography>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {success && (
        <Typography color="success.main" sx={{ mb: 2 }}>
          {success}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl fullWidth required disabled={loadingCompanies}>
          <InputLabel id="company-select-label">Компания</InputLabel>
          <Select
            labelId="company-select-label"
            label="Компания"
            value={form.companyId === '' ? '' : String(form.companyId)}
            onChange={handleTextChange('companyId')}
          >
            {companies.map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.title} ({company.city})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Название вакансии"
          value={form.name}
          onChange={handleTextChange('name')}
          fullWidth
          required
        />

        <TextField
          label="Зарплата"
          type="number"
          value={form.salary}
          onChange={handleTextChange('salary')}
          fullWidth
          InputProps={{ inputProps: { min: 0 } }}
        />

        <TextField
          label="Опыт работы (описание)"
          value={form.workExperience}
          onChange={handleTextChange('workExperience')}
          fullWidth
          multiline
          minRows={2}
        />

        <FormControl fullWidth>
          <InputLabel id="work-schedule-label">График работы</InputLabel>
          <Select
            labelId="work-schedule-label"
            label="График работы"
            value={form.workSchedule}
            onChange={handleTextChange('workSchedule')}
          >
            {WORK_SCHEDULE_VALUES.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="work-shift-label">Смена</InputLabel>
          <Select
            labelId="work-shift-label"
            label="Смена"
            value={form.workShift}
            onChange={handleTextChange('workShift')}
          >
            {WORK_SHIFT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Часы в неделю"
          type="number"
          value={form.workHours}
          onChange={handleTextChange('workHours')}
          fullWidth
          slotProps={{
            htmlInput: {
              min: 0,
              max: 80,
              step: 1,
            },
          }}
        />

        <FormControl fullWidth>
          <InputLabel id="skills-label">Навыки</InputLabel>
          <Select
            labelId="skills-label"
            multiple
            value={form.skills}
            onChange={handleMultiSelectChange('skills')}
            input={<OutlinedInput label="Навыки" />}
            renderValue={(selected) =>
              SKILL_OPTIONS.filter((o) => selected.includes(o.value))
                .map((o) => o.label)
                .join(', ')
            }
          >
            {SKILL_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox checked={form.skills.includes(option.value)} />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="language-label">Языки</InputLabel>
          <Select
            labelId="language-label"
            multiple
            value={form.language}
            onChange={handleMultiSelectChange('language')}
            input={<OutlinedInput label="Языки" />}
            renderValue={(selected) =>
              LANGUAGE_OPTIONS.filter((o) => selected.includes(o.value))
                .map((o) => o.label)
                .join(', ')
            }
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Checkbox checked={form.language.includes(option.value)} />
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormGroup row>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.remote}
                onChange={handleCheckboxChange('remote')}
              />
            }
            label="Удалённая работа"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.hybrid}
                onChange={handleCheckboxChange('hybrid')}
              />
            }
            label="Гибридный формат"
          />
        </FormGroup>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || loadingCompanies}
          >
            {submitting ? 'Создаём...' : 'Создать вакансию'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
