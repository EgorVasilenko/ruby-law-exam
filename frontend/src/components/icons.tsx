import type { ReactElement } from 'react';

interface IconProps {
  className?: string;
}

const COMMON = {
  width: 15,
  height: 15,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function ArrowUpIcon({ className }: IconProps): ReactElement {
  return (
    <svg {...COMMON} strokeWidth={2.4} className={className}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="6 11 12 5 18 11" />
    </svg>
  );
}

export function SpinnerIcon({ className }: IconProps): ReactElement {
  return (
    <svg {...COMMON} strokeWidth={2.6} className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps): ReactElement {
  return (
    <svg {...COMMON} strokeWidth={2.6} className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
