/**
 * Utility helper for merging Tailwind class names.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
