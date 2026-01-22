'use client'

import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormGroup,
  FormControlLabel,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { useResumeStore } from '@/store/useResumeStore'
import { LANGUAGE_OPTIONS, type LanguageCode } from '@/constants/languages'
import { SKILL_OPTIONS, type SkillCode } from '@/constants/skills'
import { useResume } from '@/hooks/useResume'
import type { ResumePayload } from '@/types/resume'
import { Loader } from '@/components/Loader'

type ResumeFormValues = Omit<ResumePayload, 'userid'>

export function CandidateResume() {
  const user = useUserStore((s) => s.user)

  const userId = user?.id
  const { resume, loading, error, createResume, fetchResume } =
    useResume(userId)
  const setResume = useResumeStore((state) => state.setResume)
  const clearResume = useResumeStore((state) => state.clearResume)

  const [form, setForm] = useState<ResumeFormValues>({
    title: '',
    language: [],
    skills: [],
    description: '',
    workExperience: 0,
  })

  useEffect(() => {
    if (!userId) {
      clearResume()
      return
    }

    const load = async () => {
      const data = await fetchResume()
      if (data) {
        setResume(data)
      } else {
        clearResume()
      }
    }

    load()
  }, [userId, fetchResume, setResume, clearResume])

  const handleChange =
    (field: keyof ResumeFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        field === 'workExperience' ? Number(e.target.value) : e.target.value

      setForm((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

  const handleLanguagesChange = (value: LanguageCode) => {
    setForm((prev) => {
      const exists = prev.language.includes(value)
      return {
        ...prev,
        language: exists
          ? prev.language.filter((l) => l !== value)
          : [...prev.language, value],
      }
    })
  }

  const handleSkillsChange = (value: SkillCode) => {
    setForm((prev) => {
      const exists = prev.skills.includes(value)
      return {
        ...prev,
        skills: exists
          ? prev.skills.filter((s) => s !== value)
          : [...prev.skills, value],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    const payload: ResumePayload = {
      ...form,
      userid: userId,
    }

    const created = await createResume(payload)

    if (created) {
      setResume(created)
    }
  }

  if (!userId) {
    return null
  }

  if (loading) {
    return <Loader />
  }

  if (error && !resume) {
    return (
      <Typography color="error" sx={{ mt: 2 }}>
        {error}
      </Typography>
    )
  }

  if (resume) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>
          Ваше резюме
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          {resume.title}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Языки:{' '}
          {resume.language
            .map(
              (code) =>
                LANGUAGE_OPTIONS.find((l) => l.value === code)?.label ?? code
            )
            .join(', ')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Навыки:{' '}
          {resume.skills
            .map(
              (code) =>
                SKILL_OPTIONS.find((s) => s.value === code)?.label ?? code
            )
            .join(', ')}
        </Typography>
        <Typography variant="body2" gutterBottom>
          Опыт работы: {resume.workExperience} лет
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {resume.description}
        </Typography>
      </Box>
    )
  }

  // Резюме нет — показываем форму
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      mt={4}
      display="flex"
      flexDirection="column"
      gap={2}
      maxWidth={600}
    >
      <Typography variant="h5">Создать резюме</Typography>

      <TextField
        label="Заголовок"
        value={form.title}
        onChange={handleChange('title')}
        fullWidth
        required
      />

      <TextField
        label="Описание"
        value={form.description}
        onChange={handleChange('description')}
        fullWidth
        multiline
        minRows={3}
        required
      />

      <TextField
        label="Опыт работы (лет)"
        type="number"
        value={form.workExperience}
        onChange={handleChange('workExperience')}
        fullWidth
        required
        inputProps={{ min: 0 }}
      />

      <FormControl component="fieldset" variant="standard">
        <Typography variant="subtitle1" gutterBottom>
          Языки
        </Typography>
        <FormGroup row>
          {LANGUAGE_OPTIONS.map((lang) => (
            <FormControlLabel
              key={lang.value}
              control={
                <Checkbox
                  checked={form.language.includes(lang.value)}
                  onChange={() => handleLanguagesChange(lang.value)}
                />
              }
              label={lang.label}
            />
          ))}
        </FormGroup>
      </FormControl>

      <FormControl component="fieldset" variant="standard">
        <Typography variant="subtitle1" gutterBottom>
          Навыки
        </Typography>
        <FormGroup row>
          {SKILL_OPTIONS.map((skill) => (
            <FormControlLabel
              key={skill.value}
              control={
                <Checkbox
                  checked={form.skills.includes(skill.value)}
                  onChange={() => handleSkillsChange(skill.value)}
                />
              }
              label={skill.label}
            />
          ))}
        </FormGroup>
      </FormControl>

      <Button type="submit" variant="contained" disabled={loading}>
        {loading ? 'Сохраняем...' : 'Сохранить резюме'}
      </Button>
    </Box>
  )
}
