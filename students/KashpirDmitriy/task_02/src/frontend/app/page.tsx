'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppBar, Toolbar, Button, Typography, Box } from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import { useUserStore } from '@/store/useUserStore'
import { Loader } from '@/components/Loader'
import { CandidateHomePage } from '@/components/CandidateHomePage'
import { EmployerHomePage } from '@/components/EmployerHomePage'
import { LOCAL_STORAGE_ITEMS } from '@/constants/localStorage'

export default function HomePage() {
  const router = useRouter()

  const user = useUserStore((s) => s.user)
  const isLoaded = useUserStore((s) => s.isLoaded)
  const clearUser = useUserStore((s) => s.clearUser)

  const displayName =
    (user && [user.name, user.surname].filter(Boolean).join(' ')) || 'гость'

  const handleLogout = () => {
    Object.values(LOCAL_STORAGE_ITEMS).forEach((key) => {
      localStorage.removeItem(key)
    })

    clearUser()
    router.replace('/auth/login')
  }

  useEffect(() => {
    if (!isLoaded) return

    if (!user) {
      router.replace('/auth/login')
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
    return <Loader />
  }

  if (!user) {
    return null
  }

  return (
    <>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ justifyContent: 'space-between' }} className="wrapper">
          <Typography variant="h6" component="h6">
            {user.role === 'worker' && 'Добро пожаловать,'}
            {user.role === 'employer' && 'Кабинет работодателя,'}
            &nbsp;
            <Box component="span" fontWeight={700}>
              {displayName}
            </Box>
            !
          </Typography>
          <Button
            color="inherit"
            endIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Выйти
          </Button>
        </Toolbar>
      </AppBar>

      <main className="wrapper py-7">
        {user.role === 'worker' && <CandidateHomePage />}
        {user.role === 'employer' && <EmployerHomePage />}
      </main>
    </>
  )
}
