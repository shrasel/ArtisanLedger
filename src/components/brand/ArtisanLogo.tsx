'use client';

import React from 'react';

interface ArtisanLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'full';
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
  animated?: boolean;
  onPaper?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

const SIZE_MAP = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
};

const FULL_SIZE_MAP = {
  xs: 'h-6 w-auto',
  sm: 'h-8 w-auto',
  md: 'h-10 w-auto',
  lg: 'h-12 w-auto',
  xl: 'h-16 w-auto',
};

export function ArtisanLogo({
  size = 'md',
  variant = 'icon',
  showWordmark = false,
  subtitle,
  className = '',
  animated = false,
  onPaper = false,
  theme = 'auto',
}: ArtisanLogoProps) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const fullSizeClass = FULL_SIZE_MAP[size] || FULL_SIZE_MAP.md;

  // Determine stroke color classes based on theme and paper surface
  let inkClass = 'stroke-[#212224] dark:stroke-[#F0EBE1]';
  let accentClass = 'stroke-[#2B4C3F] dark:stroke-[#9ABBA8]';
  let textClass = 'text-[#212224] dark:text-[#F0EBE1]';
  let subtextClass = 'text-[#2B4C3F] dark:text-[#9ABBA8]';

  if (onPaper || theme === 'light') {
    inkClass = 'stroke-[#212224]';
    accentClass = 'stroke-[#2B4C3F]';
    textClass = 'text-[#212224]';
    subtextClass = 'text-[#2B4C3F]';
  } else if (theme === 'dark') {
    inkClass = 'stroke-[#F0EBE1]';
    accentClass = 'stroke-[#9ABBA8]';
    textClass = 'text-[#F0EBE1]';
    subtextClass = 'text-[#9ABBA8]';
  }

  // If full wordmark logo variant requested
  if (variant === 'full') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {/* Full Vector SVG with exact brand geometry */}
        <svg
          className={`${fullSizeClass} shrink-0 transition-transform duration-200 ${
            animated ? 'hover:scale-[1.02]' : ''
          }`}
          viewBox="0 0 620 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Artisan Ledger"
        >
          {/* Folded Paper Document Outline */}
          <path
            d="M20 15h42l19 19v70H20z M62 16v19h19"
            fill="none"
            className={inkClass}
            strokeWidth="4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          {/* Ledger Horizontal Rules */}
          <path
            d="M34 50h32 M34 63h32 M34 76h21"
            fill="none"
            className={inkClass}
            strokeWidth="3"
            strokeLinecap="square"
          />
          {/* Verification Mark */}
          <path
            d="m59 89 6 6 11-13"
            fill="none"
            className={accentClass}
            strokeWidth="4"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          {/* Typography */}
          <text
            x="108"
            y="62"
            className={textClass}
            fill="currentColor"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontSize="38"
            fontWeight="600"
            letterSpacing="-1.1"
          >
            Artisan Ledger
          </text>
          <text
            x="110"
            y="91"
            className={subtextClass}
            fill="currentColor"
            fontFamily="'Courier New', Courier, monospace"
            fontSize="11"
            fontWeight="500"
            letterSpacing="3.2"
          >
            INVOICE
          </text>
        </svg>
      </div>
    );
  }

  // Icon Emblem Variant (128x128 Geometry)
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        className={`${sizeClass} shrink-0 transition-transform duration-200 ${
          animated ? 'hover:scale-105' : ''
        }`}
        viewBox="0 0 128 128"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Document Folded Sheet */}
        <path
          d="M25 14h48l30 30v70H25z M73 15v30h29"
          fill="none"
          className={inkClass}
          strokeWidth="5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {/* Ledger Rules */}
        <path
          d="M42 60h44 M42 75h44 M42 90h27"
          fill="none"
          className={inkClass}
          strokeWidth="4"
          strokeLinecap="square"
        />
        {/* Verification Checkmark */}
        <path
          d="m75 99 7 7 14-17"
          fill="none"
          className={accentClass}
          strokeWidth="5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
      </svg>

      {/* Optional Wordmark when requested beside icon */}
      {showWordmark && (
        <div className="min-w-0">
          <span className="font-serif text-base sm:text-lg 2xl:text-xl font-bold tracking-tight text-paper block leading-none truncate">
            Artisan Ledger
          </span>
          {subtitle && (
            <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-ink-ghost block mt-0.5 truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
