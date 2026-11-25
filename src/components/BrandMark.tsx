import type { SVGProps } from 'react';

interface BrandMarkProps {
  variant?: 'default' | 'inverted';
  badge?: string;
  compact?: boolean;
  hideBadgeOnMobile?: boolean;
  iconInverted?: boolean;
}

interface BrandIconProps {
  size?: number;
  inverted?: boolean;
}

/**
 * Geometric Match-T emblem: unified white T with locking Signal Mint match spark.
 */
export function BrandIcon({ size = 34, inverted = true }: BrandIconProps) {
  return (
    <span
      className={`brand-icon ${inverted ? 'brand-icon-inverted' : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          width="32"
          height="32"
          rx="9"
          fill={inverted ? '#393BE7' : '#12152E'}
        />
        <rect
          x="0.5"
          y="0.5"
          width="31"
          height="31"
          rx="8.5"
          stroke="#FFFFFF"
          strokeOpacity="0.14"
        />
        <path
          d="M7 10C7 8.89543 7.89543 8 9 8H16C17.1046 8 18 8.89543 18 10V22C18 23.1046 17.1046 24 16 24C14.8954 24 14 23.1046 14 22V12H9C7.89543 12 7 11.1046 7 10Z"
          fill="#FFFFFF"
        />
        <rect className="brand-spark" x="20" y="8" width="5" height="4" rx="2" fill="#86E5A1" />
      </svg>
    </span>
  );
}

export function BrandMark({
  variant = 'default',
  badge,
  compact = false,
  hideBadgeOnMobile = false,
  iconInverted,
}: BrandMarkProps) {
  const isInverted = variant === 'inverted';

  return (
    <span className={`brand-mark ${isInverted ? 'brand-mark-inverted' : ''}`}>
      <BrandIcon size={compact ? 30 : 34} inverted={iconInverted ?? true} />
      <span className="brand-wordmark">Trabalhaki</span>
      {badge && (
        <span
          className={`brand-tag ${isInverted ? 'brand-tag-inverted' : ''} ${
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
