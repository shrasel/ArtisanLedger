'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'VIEWED' | 'PAID' | 'VOID';

interface StatusStampProps {
  status: InvoiceStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusStamp({ status, size = 'md', className }: StatusStampProps) {
  const normalized = (status || 'DRAFT').toUpperCase() as InvoiceStatus;

  const config = {
    DRAFT: {
      label: 'DRAFT',
      borderClass: 'border-[#D4AF37] text-[#D4AF37]',
      bgClass: 'bg-[#D4AF37]/5',
      tilt: '-rotate-2',
    },
    SENT: {
      label: 'DISPATCHED',
      borderClass: 'border-[#5C5E62] text-[#5C5E62]',
      bgClass: 'bg-[#5C5E62]/5',
      tilt: 'rotate-1',
    },
    VIEWED: {
      label: 'OPENED / VIEWED',
      borderClass: 'border-[#C84630] text-[#C84630]',
      bgClass: 'bg-[#C84630]/5',
      tilt: '-rotate-1',
    },
    PAID: {
      label: 'CERTIFIED PAID',
      borderClass: 'border-[#2B4C3F] text-[#2B4C3F]',
      bgClass: 'bg-[#2B4C3F]/5',
      tilt: '-rotate-3',
    },
    VOID: {
      label: 'VOIDED',
      borderClass: 'border-[#18191B] text-[#18191B]',
      bgClass: 'bg-[#18191B]/5',
      tilt: 'rotate-2',
    },
  }[normalized] || {
    label: normalized,
    borderClass: 'border-[#5C5E62] text-[#5C5E62]',
    bgClass: 'bg-[#5C5E62]/5',
    tilt: 'rotate-0',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2.5 py-0.5 tracking-[0.2em] border',
    md: 'text-xs px-3.5 py-1 tracking-[0.25em] border-[1.5px]',
    lg: 'text-sm px-5 py-2 tracking-[0.3em] border-2 font-bold',
  }[size];

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center font-mono uppercase select-none rounded-[1px] transition-transform duration-200',
        'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]',
        config.borderClass,
        config.bgClass,
        config.tilt,
        sizeStyles,
        className
      )}
      style={{
        boxShadow: '0 0 0 1px currentColor inset, 0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <span className="relative z-10 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
        {config.label}
      </span>
    </div>
  );
}

