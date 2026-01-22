'use client'

import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Paper,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
} from '@mui/material'
import { useState } from 'react'
import { useUserStore } from '@/store/useUserStore'
import { Loader } from '@/components/Loader'
import {
  type BusinessAreaCode,
  type CompanyPayload,
  useCompanies,
} from '@/hooks/useCompanies'
import { SKILL_VALUES } from '@/constants/skills'

export function CompanyFormWithList() {
  const user = useUserStore((s) => s.user)
  const userId = user?.id

  const { companies, loading, error, createCompany } = useCompanies(userId)

  const [form, setForm] = useState<CompanyPayload>({
    title: '',
    city: '',
    businessAreas: [],
  })

  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleInputChange =
    (field: keyof Omit<CompanyPayload, 'businessAreas'>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: e.target.value,
      }))
    }

  const handleBusinessAreaToggle = (area: BusinessAreaCode) => () => {
    setForm((prev) => {
      const exists = prev.businessAreas.includes(area)
      return {
        ...prev,
        businessAreas: exists
          ? prev.businessAreas.filter((a) => a !== area)
          : [...prev.businessAreas, area],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!form.title.trim() || !form.city.trim()) {
      setSubmitError('Заполните название компании и город')
      return
    }

    if (form.businessAreas.length === 0) {
      setSubmitError('Выберите хотя бы одну сферу деятельности')
      return
    }

    const result = await createCompany(form)

    if (result) {
      setForm({
        title: '',
        city: '',
        businessAreas: [],
      })
    } else {
      setSubmitError('Не удалось создать компанию')
    }
  }

  if (!userId) {
    return (
      <Typography>
        Для работы с компаниями нужно быть авторизованным пользователем.
      </Typography>
    )
  }

  return (
    <div className="wrapper py-10">
      <div className="wrapper flex flex-col gap-6 md:flex-row">
        {/* Левая колонка — форма создания компании */}
        <div className="md:w-1/2">
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Создать компанию
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit}
              display="flex"
              flexDirection="column"
              gap={2}
            >
              <TextField
                label="Название компании"
                value={form.title}
                onChange={handleInputChange('title')}
                fullWidth
                required
              />

              <TextField
                label="Город"
                value={form.city}
                onChange={handleInputChange('city')}
                fullWidth
                required
              />

              <FormControl component="fieldset" variant="standard">
                <Typography variant="subtitle1" gutterBottom>
                  Сферы деятельности
                </Typography>
                <FormGroup>
                  {SKILL_VALUES.map((area) => (
                    <FormControlLabel
                      key={area}
                      control={
                        <Checkbox
                          checked={form.businessAreas.includes(
                            area as BusinessAreaCode
                          )}
                          onChange={handleBusinessAreaToggle(
                            area as BusinessAreaCode
                          )}
                        />
                      }
                      label={area}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              {(error || submitError) && (
                <Alert severity="error">{submitError || error}</Alert>
              )}

              <Box display="flex" justifyContent="flex-end">
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? 'Сохранение...' : 'Создать компанию'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </div>

        {/* Правая колонка — список компаний */}
        <div className="md:w-full">
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="h6" component="h2">
                Мои компании
              </Typography>
              {loading && <Loader />}
            </Box>

            {companies.length === 0 ? (
              <Typography color="text.secondary">
                Пока нет ни одной компании. Добавьте первую с помощью формы
                слева.
              </Typography>
            ) : (
              <List>
                {companies.map((company) => (
                  <ListItem key={company.id} divider>
                    <ListItemText
                      primary={company.title}
                      secondary={`${
                        company.city
                      } — ${company.businessAreas.join(', ')}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </div>
      </div>
    </div>
  )
}
