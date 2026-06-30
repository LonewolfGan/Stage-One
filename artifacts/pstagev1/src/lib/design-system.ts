/**
 * PSTAGEV1 — Design System
 * Source of truth for all colors, radii, and type scales.
 * ⚠️ Every color reference in the app MUST use ds.colors.xxx — never a hex literal.
 */
export const ds = {
  colors: {
    canvas:        "#FFFFFF",
    canvasSubtle:  "#FAFAFA",
    canvasMuted:   "#F5F5F5",
    ink:           "#0C0C0E",
    inkSecondary:  "rgba(12, 12, 14, 0.65)",
    inkTertiary:   "rgba(12, 12, 14, 0.45)",
    inkDisabled:   "rgba(12, 12, 14, 0.28)",
    border:        "rgba(12, 12, 14, 0.10)",
    borderMedium:  "rgba(12, 12, 14, 0.16)",
    borderStrong:  "rgba(12, 12, 14, 0.24)",
    accent:        "#D4466E",
    accentHover:   "#B8345B",
    accentLight:   "#FBEEF1",
    accentBorder:  "rgba(212, 70, 110, 0.22)",
    rating:        "#F59E0B",
    success:       "#33CA7F",
    successBg:     "#EAFAF1",
    successBorder: "rgba(51, 202, 127, 0.24)",
    error:         "#E11D32",
    errorBg:       "#FDEBEE",
    errorBorder:   "rgba(225, 29, 50, 0.24)",
  },
  radius: {
    xs:   "4px",
    sm:   "6px",
    md:   "8px",
    lg:   "12px",
    xl:   "16px",
    full: "9999px",
  },
  font: {
    display:  "48px / 1.10  -0.03em 600",
    headingL: "32px / 1.20  -0.02em 600",
    headingM: "24px / 1.25  -0.01em 600",
    headingS: "18px / 1.35  -0.01em 500",
    bodyL:    "17px / relaxed normal",
    body:     "15px / relaxed normal",
    bodyS:    "13px / 1.50  normal",
    label:    "14px / none  500",
    caption:  "12px / 1.40  normal",
  },
} as const;

export type DsColor = keyof typeof ds.colors;
