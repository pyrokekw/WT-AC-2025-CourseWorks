'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import { SelectChangeEvent } from '@mui/material/Select'
import { useRegister } from '@/hooks/useRegister'
import { UserRole } from '@/types/user'

interface RegisterFormValues {
  email: string
  name: string
  surname: string
  age: string
  role: UserRole
  password: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { loading, error, register } = useRegister()

  const [form, setForm] = useState<RegisterFormValues>({
    email: '',
    name: '',
    surname: '',
    age: '',
    role: 'worker',
    password: '',
  })

  const handleInputChange =
    (field: Exclude<keyof RegisterFormValues, 'role'>) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }))
    }

  const handleRoleChange = (event: SelectChangeEvent<UserRole>) => {
    setForm((prev) => ({
      ...prev,
      role: event.target.value as UserRole,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const ageNumber = Number(form.age)
    if (Number.isNaN(ageNumber) || ageNumber <= 0) {
      alert('Пожалуйста, введите корректный возраст')
      return
    }

    const res = await register({
      email: form.email,
      name: form.name,
      surname: form.surname,
      age: ageNumber,
      role: form.role,
      password: form.password,
    })

    if (!res) {
      return
    }

    router.replace('/auth/login/')
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 480,
          p: { xs: 3, md: 4 },
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" component="h1" mb={2} fontWeight={600}>
          Регистрация
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Создай аккаунт, чтобы искать работу или размещать вакансии.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={handleInputChange('email')}
              fullWidth
              required
            />

            <TextField
              label="Имя"
              value={form.name}
              onChange={handleInputChange('name')}
              fullWidth
              required
            />

            <TextField
              label="Фамилия"
              value={form.surname}
              onChange={handleInputChange('surname')}
              fullWidth
              required
            />

            <TextField
              label="Возраст"
              type="number"
              value={form.age}
              onChange={handleInputChange('age')}
              fullWidth
              required
              slotProps={{
                input: {
                  inputProps: {
                    minLength: 6,
                  },
                },
              }}
            />

            <FormControl fullWidth>
              <InputLabel id="role-label">Роль</InputLabel>
              <Select
                labelId="role-label"
                label="Роль"
                value={form.role}
                onChange={handleRoleChange}
              >
                <MenuItem value="worker">Соискатель</MenuItem>
                <MenuItem value="employer">Работодатель</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Пароль"
              type="password"
              value={form.password}
              onChange={handleInputChange('password')}
              fullWidth
              required
              slotProps={{
                input: {
                  inputProps: {
                    minLength: 6,
                  },
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              fullWidth
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>

            <Typography variant="body2" textAlign="center">
              Уже есть аккаунт?{' '}
              <Typography
                component={Link}
                href="/auth/login"
                color="primary"
                sx={{ textDecoration: 'none', fontWeight: 500 }}
              >
                Войти
              </Typography>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
