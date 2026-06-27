import { useEffect, useState } from "react";

interface PenWritingTextProps {
  children: string;
  duration?: number;
  delay?: number;
  className?: string;
}

// Split text into words (including hyphenated words as single units)
function splitIntoWords(text: string): string[] {
  const words: string[] = [];
  const regex = /[^\s\u00A0]+|[\s\u00A0]+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    words.push(match[0]);
  }
  return words.length > 0 ? words : [text];
}

export function PenWritingText({
  children,
  duration = 6,
  delay = 0,
  className,
}: PenWritingTextProps) {
  const [progress, setProgress] = useState(0);
  const words = splitIntoWords(children);

  useEffect(() => {
    const delayMs = delay * 1000;
    const totalMs = duration * 1000;

    let raf: number;
    let startTime: number | null = null;

    const delayTimer = setTimeout(() => {
      const animate = (now: number) => {
        if (startTime === null) startTime = now;
        const elapsed = now - startTime;
        const p = Math.min(elapsed / totalMs, 1);
        // Ease out cubic for smooth handwriting feel
        const eased = 1 - Math.pow(1 - p, 3);
        setProgress(eased);
        if (p < 1) {
          raf = requestAnimationFrame(animate);
        }
      };
      raf = requestAnimationFrame(animate);
    }, delayMs);

    return () => {
      clearTimeout(delayTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [children, duration, delay]);

  return (
    <span className={className} style={{ position: "relative" }}>
      {words.map((word, i) => {
        const wordProgress = Math.min(Math.max((progress * words.length - i), 0), 1);
        const isSpace = /^\s+$/.test(word);
        return (
          <span
            key={i}
            style={{
              display: isSpace ? "inline" : "inline-block",
              opacity: wordProgress,
              transform: `translateY(${(1 - wordProgress) * 4}px)`,
              transition: "none",
              willChange: "opacity, transform",
              whiteSpace: isSpace ? "pre" : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
}
