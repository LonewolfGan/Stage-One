import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeUp, fadeIn, staggerContainer } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  variant?: "up" | "fade";
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  once?: boolean;
}

export function Reveal({
  children,
  variant = "up",
  delay = 0,
  className,
  style,
  once = true,
}: RevealProps) {
  const vars = variant === "fade" ? fadeIn : fadeUp;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-60px" }}
      variants={{
        hidden: vars.hidden,
        visible: {
          ...(vars.visible as object),
          transition: {
            ...((vars.visible as { transition?: object }).transition ?? {}),
            delay,
          },
        },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}

export function Stagger({ children, className, style, delay = 0 }: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        ...staggerContainer,
        visible: {
          transition: {
            staggerChildren: 0.09,
            delayChildren: delay,
          },
        },
      }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div variants={fadeUp} className={className} style={style}>
      {children}
    </motion.div>
  );
}
