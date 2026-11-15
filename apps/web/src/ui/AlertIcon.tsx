import type { AlertClass } from '@app/core';

/**
 * One shape per alert class, so the class can be told apart without colour:
 * ring (none), circle with "i" (advisory), triangle (caution), octagon (warning).
 */
export function AlertIcon({ alert, size = 20 }: { alert: AlertClass; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false } as const;
  switch (alert) {
    case 'advisory':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <rect x="11" y="10.5" width="2" height="7" fill="var(--color-bg)" />
          <circle cx="12" cy="7.5" r="1.3" fill="var(--color-bg)" />
        </svg>
      );
    case 'caution':
      return (
        <svg {...common}>
          <path d="M12 2.5 22.5 21h-21z" fill="currentColor" />
          <rect x="11" y="9" width="2" height="6.5" fill="var(--color-bg)" />
          <circle cx="12" cy="18" r="1.3" fill="var(--color-bg)" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...common}>
          <path d="M8 2h8l6 6v8l-6 6H8l-6-6V8z" fill="currentColor" />
          <rect x="11" y="6.5" width="2" height="7.5" fill="var(--color-bg)" />
          <circle cx="12" cy="17" r="1.3" fill="var(--color-bg)" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      );
  }
}
