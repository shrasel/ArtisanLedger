'use client';

import React from 'react';

interface ArtisanLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
  animated?: boolean;
}

const SIZE_MAP = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
};

export function ArtisanLogo({
  size = 'md',
  showWordmark = false,
  subtitle,
  className = '',
  animated = false,
}: ArtisanLogoProps) {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Handcrafted Emblem Mark */}
      <svg
        className={`${sizeClass} shrink-0 rounded-[22%] shadow-xs transition-transform duration-200 ${
          animated ? 'hover:scale-105' : ''
        }`}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Archival Obsidian Container */}
        <rect width="64" height="64" rx="14" fill="#18191D" />
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="12"
          stroke="#2B2D35"
          strokeWidth="1.5"
        />

        {/* Architect Apex & Caliper (A) in Archival Cotton Paper Ink */}
        <path
          d="M32 14L46 44H38.5L32 28.5L25.5 44H18L32 14Z"
          fill="#FAF8F5"
        />

        {/* Ledger Base & Pedestal (L) in Rich Status Brass */}
        <path d="M26 38H46V44H26V38Z" fill="#D4AF37" />

        {/* Horizontal Ruled Ledger Guideline */}
        <rect x="23" y="32" width="18" height="2" fill="#D4AF37" rx="0.5" />

        {/* Precision Artisan Compass Diamond */}
        <polygon points="32,19 34.5,23 32,27 29.5,23" fill="#D4AF37" />
      </svg>

      {/* Optional Wordmark */}
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
