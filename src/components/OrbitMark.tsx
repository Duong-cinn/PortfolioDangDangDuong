/** Tiny brand mark: a core with one tilted orbit. Inherits color via currentColor. */
export function OrbitMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.9" />
      <ellipse cx="12" cy="12" rx="10.5" ry="4.2" stroke="currentColor" strokeWidth="1.2" transform="rotate(-28 12 12)" />
      <circle cx="20.6" cy="7.6" r="1.4" fill="currentColor" />
    </svg>
  );
}
