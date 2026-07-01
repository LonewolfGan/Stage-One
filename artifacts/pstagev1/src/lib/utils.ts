import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Generate up-to-2-letter initials from a full name. */
export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Format price in MAD from cents. */
export function formatPrice(cents: number): string {
  return `${(cents / 100).toFixed(0)} MAD`;
}
