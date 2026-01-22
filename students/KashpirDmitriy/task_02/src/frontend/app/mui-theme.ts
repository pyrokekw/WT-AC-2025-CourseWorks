'use client'

import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a0a0a',
      paper: '#111111',
    },
    text: {
      primary: '#ededed',
      secondary: '#9ca3af',
    },
  },
})
