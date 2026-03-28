import { IconButton } from '@mui/material'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'

export interface SliderArrowButtonProps {
  direction: 'left' | 'right'
  onClick: () => void
  ariaLabel?: string
  sxOverride?: object
}

export function SliderArrowButton({ direction, onClick, ariaLabel, sxOverride }: SliderArrowButtonProps) {
  return (
    <IconButton
      onClick={onClick}
      aria-label={ariaLabel ?? (direction === 'left' ? '이전' : '다음')}
      size="small"
      sx={{
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
        width: 40,
        height: 40,
         ...(direction === 'left'
          ? { left: { xs: 8, sm: 12, md: 16 } }
          : { right: { xs: 8, sm: 12, md: 16 } }),
        '&:hover': {
          bgcolor: 'grey.100',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          transform: 'translateY(-50%) scale(1.07)',
        },
        transition: 'background 0.18s, box-shadow 0.18s, transform 0.18s',
        ...sxOverride,
      }}
    >
      {direction === 'left' ? (
        <ArrowBackIosNewIcon fontSize="small" sx={{ color: 'text.primary' }} />
      ) : (
        <ArrowForwardIosIcon fontSize="small" sx={{ color: 'text.primary' }} />
      )}
    </IconButton>
  )
}
