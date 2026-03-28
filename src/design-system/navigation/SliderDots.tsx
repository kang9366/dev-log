import { Box } from '@mui/material'

export interface SliderDotsProps {
  total: number
  current: number
  onDotClick: (index: number) => void
}

export function SliderDots({ total, current, onDotClick }: SliderDotsProps) {
  return (
    <Box display="flex" justifyContent="center" gap="6px" mt={2.5}>
      {Array.from({ length: total }).map((_, i) => (
        <Box
          key={i}
          component="button"
          onClick={() => onDotClick(i)}
          aria-label={`슬라이드 ${i + 1}`}
          sx={{
            width: i === current ? 36 : 28,
            height: 6,
            borderRadius: '3px',
            bgcolor: i === current ? 'grey.600' : 'grey.300',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            outline: 'none',
            transition: 'background 0.2s, width 0.2s',
            '&:hover': {
              bgcolor: i === current ? 'grey.700' : 'grey.400',
            },
          }}
        />
      ))}
    </Box>
  )
}

