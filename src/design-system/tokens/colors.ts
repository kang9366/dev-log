/**
 * Design System – Color Tokens
 *
 * 3-tier 구조:
 *   Primitive  → 팔레트 원색
 *   Semantic   → 역할 기반 토큰 (primary / neutral / status)
 *   Component  → 컴포넌트 전용 alias (필요 시 확장)
 */

// ─────────────────────────────────────────────
// Primitive Palette
// ─────────────────────────────────────────────
export const primitives = {
  /** Brand: Indigo */
  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },

  /** Neutral: Warm slate */
  neutral: {
    0:   '#ffffff',
    50:  '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    1000: '#000000',
  },

  /** Status */
  green: {
    50:  '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  red: {
    50:  '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
  },
  amber: {
    50:  '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  blue: {
    50:  '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
  },
} as const

// ─────────────────────────────────────────────
// Semantic Tokens  (Light mode default)
// ─────────────────────────────────────────────
export const colors = {
  // ── Brand / Primary ──────────────────────
  primary: {
    lighter:  primitives.indigo[50],
    light:    primitives.indigo[300],
    main:     primitives.indigo[500],
    dark:     primitives.indigo[700],
    darker:   primitives.indigo[900],
    contrast: primitives.neutral[0],
  },

  // ── Background ───────────────────────────
  bg: {
    default:  primitives.neutral[100],   // 페이지 배경
    paper:    primitives.neutral[0],     // 카드 / 패널
    overlay:  'rgba(0, 0, 0, 0.04)',    // 호버 레이어
  },

  // ── Text ─────────────────────────────────
  text: {
    primary:   primitives.neutral[900],
    secondary: primitives.neutral[500],
    disabled:  primitives.neutral[400],
    inverse:   primitives.neutral[0],
    link:      primitives.indigo[600],
  },

  // ── Border / Divider ─────────────────────
  border: {
    default: primitives.neutral[200],
    strong:  primitives.neutral[300],
    focus:   primitives.indigo[400],
  },

  // ── Status ───────────────────────────────
  success: {
    light: primitives.green[50],
    main:  primitives.green[500],
    dark:  primitives.green[600],
  },
  error: {
    light: primitives.red[50],
    main:  primitives.red[500],
    dark:  primitives.red[600],
  },
  warning: {
    light: primitives.amber[50],
    main:  primitives.amber[500],
    dark:  primitives.amber[600],
  },
  info: {
    light: primitives.blue[50],
    main:  primitives.blue[500],
    dark:  primitives.blue[600],
  },
} as const

export type Colors = typeof colors

