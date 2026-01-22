import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

export const Loader = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  )
}
