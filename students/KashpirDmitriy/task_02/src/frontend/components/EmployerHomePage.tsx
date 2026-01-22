'use client'

import Link from 'next/link'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Grid,
} from '@mui/material'
import { EmployerJobsAppliedList } from './EmployerJobsAppliedList'
import { EmployerChatsList } from './EmployerChatsList'

export function EmployerHomePage() {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Панель работодателя
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Управляйте компаниями и вакансиями в одном месте.
      </Typography>

      <EmployerChatsList />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid container spacing={3}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Мои компании
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Просматривайте и редактируйте список своих компаний.
              </Typography>

              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  component={Link}
                  href="/employer/companies"
                >
                  Перейти к компаниям
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid container spacing={3}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Вакансии
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Создавайте новые вакансии и управляйте откликами кандидатов.
              </Typography>

              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  component={Link}
                  href="/employer/jobs"
                >
                  Перейти к вакансиям
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <EmployerJobsAppliedList />
    </Box>
  )
}
