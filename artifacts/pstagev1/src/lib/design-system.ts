/**
 * Anubis — Design System
 * Source of truth for all colors, radii, and type scales.
 * ⚠️ Every color reference in the app MUST use ds.colors.xxx — never a hex literal.
 */
export const ds = {
  colors: {
    canvas: '#FFFFFF',
    canvasSubtle: '#FAFAFA',
    canvasMuted: '#F5F5F5',
    ink: '#0C0C0E',
    inkSecondary: 'rgba(12, 12, 14, 0.65)',
    inkTertiary: 'rgba(12, 12, 14, 0.45)',
    inkDisabled: 'rgba(12, 12, 14, 0.28)',
    border: 'rgba(12, 12, 14, 0.10)',
    borderMedium: 'rgba(12, 12, 14, 0.16)',
    borderStrong: 'rgba(12, 12, 14, 0.24)',
    accent: '#D4466E',
    accenthover: '#B8345B',
    accentLight: '#FBEEF1',
    accentBorder: 'rgba(212, 70, 110, 0.22)',
    rating: '#F59E0B',
    success: '#33CA7F',
    successBg: '#EAFAF1',
    successBorder: 'rgba(51, 202, 127, 0.22)',
    error: '#E11D32',
    errorBg: '#FDEBEE',
    errorBorder: 'rgba(225, 29, 50, 0.22)',
    info: '#3B82F6',
    infoBg: 'rgba(59, 130, 246, 0.05)',
    infoBorder: 'rgba(59, 130, 246, 0.22)',
    warning: '#FBBF24',
    warningBg: '#FFFBEB',
    warningBorder: 'rgba(251, 191, 36, 0.2)',
    completed: '#33CA7F',
    completedBg: '#EAFAF1',
    completedBorder: 'rgba(51, 202, 127, 0.22)',
  },
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  font: {
    display: 'text-[48px] font-semibold leading-[1.10] tracking-[-0.03em]',
    headingL: 'text-[32px] font-semibold leading-[1.20] tracking-[-0.02em]',
    headingM: 'text-[24px] font-semibold leading-[1.25] tracking-[-0.01em]',
    headingS: 'text-[18px] font-medium leading-[1.35] tracking-[-0.01em]',
    bodyL: 'text-[17px] font-normal leading-relaxed',
    body: 'text-[15px] font-normal leading-relaxed',
    bodyS: 'text-[13px] font-normal leading-[1.50]',
    label: 'text-[14px] font-medium leading-none',
    caption: 'text-[12px] font-normal leading-[1.40]',
  }
} as const;