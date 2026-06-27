import type { Variants, Transition } from "framer-motion";

// ─── Shared easing ───────────────────────────────────────────────────────────
export const ease = {
  out: [0.0, 0.0, 0.2, 1] as const,
  in: [0.4, 0.0, 1.0, 1] as const,
  inOut: [0.4, 0.0, 0.2, 1] as const,
  spring: { type: "spring", stiffness: 340, damping: 30 } as Transition,
  springSnappy: { type: "spring", stiffness: 500, damping: 36 } as Transition,
};

// ─── Scroll reveal variants ───────────────────────────────────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: ease.out },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.45, ease: ease.out },
  },
};

export const fadeUpSlow: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: ease.out },
  },
};

// ─── Stagger container ────────────────────────────────────────────────────────
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.0,
    },
  },
};

// ─── Page transition ──────────────────────────────────────────────────────────
export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.28, ease: ease.out } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: ease.in } },
};

// ─── Card / interactive ───────────────────────────────────────────────────────
export const cardHover = {
  whileHover: { scale: 1.012 },
  whileTap: { scale: 0.985 },
  transition: { type: "spring", stiffness: 400, damping: 28 },
};

export const buttonTap = {
  whileTap: { scale: 0.95 },
  transition: { type: "spring", stiffness: 500, damping: 30 },
};

export const subtleHover = {
  whileHover: { scale: 1.025 },
  transition: { type: "spring", stiffness: 380, damping: 28 },
};
