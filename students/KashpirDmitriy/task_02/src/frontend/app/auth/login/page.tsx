'use client'

import { useState, FormEvent, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  Stack,
  Alert,
} from '@mui/material'
import Link from 'next/link'
import { useLogin } from '@/hooks/useLogin'
import { useUserStore } from '@/store/useUserStore'

interface LoginFormValues {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { loading, error, login } = useLogin()
  const setUser = useUserStore((state) => state.setUser)

  const [form, setForm] = useState<LoginFormValues>({
    email: '',
    password: '',
  })

  const handleInputChange =
    (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: event.target.value,
      }))
    }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!form.email || !form.password) {
      alert('Введите email и пароль')
      return
    }

    const data = await login({
      email: form.email,
      password: form.password,
    })

    if (!data) {
      return
    }

    if (data?.user) {
      setUser(data?.user)
      router.replace('/')
    }
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
          Вход
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Войдите в аккаунт, чтобы продолжить поиск работы или размещать
          вакансии.
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
              {loading ? 'Входим...' : 'Войти'}
            </Button>

            <Typography variant="body2" textAlign="center">
              Нет аккаунта?{' '}
              <Typography
                component={Link}
                href="/auth/register"
                color="primary"
                sx={{ textDecoration: 'none', fontWeight: 500 }}
              >
                Зарегистрироваться
              </Typography>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
