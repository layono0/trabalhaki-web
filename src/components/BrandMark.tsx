import type { SVGProps } from 'react';

interface BrandMarkProps {
  variant?: 'default' | 'inverted';
  badge?: string;
  compact?: boolean;
  hideBadgeOnMobile?: boolean;
}

export function BrandIcon({ size = 36 }: { size?: number }) {
  return (
    <span
      className="brand-icon"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Two interlocking opportunity cards forming a geometric T-match emblem */}
        <rect
          x="3"
          y="3.5"
          width="11"
          height="13.5"
          rx="3"
          fill="#FFFFFF"
          fillOpacity="0.34"
        />
        <rect
          x="10"
          y="7"
          width="11"
          height="13.5"
          rx="3"
          fill="#FFFFFF"
        />
        <path
          d="M13 13.75L14.75 15.5L18.25 11.75"
          stroke="#12152E"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="8.5" cy="7.5" r="2.25" fill="#86E5A1" />
      </svg>
    </span>
  );
}

export function BrandMark({
  variant = 'default',
  badge,
  compact = false,
  hideBadgeOnMobile = false,
}: BrandMarkProps) {
  return (
    <span className={`brand-mark ${variant === 'inverted' ? 'brand-mark-inverted' : ''}`}>
      <BrandIcon size={compact ? 32 : 36} />
      <span className="brand-wordmark">Trabalhaki</span>
      {badge && (
        <span
          className={`badge ${variant === 'inverted' ? 'badge-on-dark' : 'badge-indigo'} ${
            hideBadgeOnMobile ? 'hide-on-mobile' : ''
          }`}
        >
          {badge}
        </span>
      )}
    </span>
  );
}

interface TriageIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Authored card-triage icon replacing generic Flame icons in navigation and action buttons.
 */
export function TriageIcon({ size = 18, ...props }: TriageIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="4" width="12" height="15" rx="2.5" />
      <path d="M15 7h3.5A2.5 2.5 0 0 1 21 9.5v9A2.5 2.5 0 0 1 18.5 21H9.5A2.5 2.5 0 0 1 7 19" />
      <path d="M6.8 11.5L8.6 13.3L11.6 9.8" />
    </svg>
  );
}
