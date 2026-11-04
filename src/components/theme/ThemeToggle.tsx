'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export type ThemePreference = 'light' | 'dark' | 'system';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<ThemePreference>('system');
  const [mounted, setMounted] = useState(false);

  // Apply theme to DOM
  const applyTheme = (pref: ThemePreference) => {
    try {
      const meta = document.querySelector('meta[name="color-scheme"]');
      const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark = pref === 'dark' || (pref === 'system' && isSystemDark);

      if (pref === 'system') {
        localStorage.removeItem('color-scheme');
        if (meta) meta.setAttribute('content', 'light dark');
      } else {
        localStorage.setItem('color-scheme', pref);
        if (meta) meta.setAttribute('content', pref);
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // Fallback for private mode or blocked storage
    }
  };

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('color-scheme') as ThemePreference | null;
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
        applyTheme(stored);
      } else {
        setTheme('system');
        applyTheme('system');
      }
    } catch {
      setTheme('system');
    }

    // Sync across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'color-scheme') {
        const val = (e.newValue as ThemePreference) || 'system';
        setTheme(val);
        applyTheme(val);
      }
    };

    // Follow system changes when in 'system' mode
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMedia = () => {
      const stored = localStorage.getItem('color-scheme');
      if (!stored) {
        applyTheme('system');
      }
    };

    window.addEventListener('storage', handleStorage);
    media.addEventListener('change', handleMedia);

    return () => {
      window.removeEventListener('storage', handleStorage);
      media.removeEventListener('change', handleMedia);
    };
  }, []);

  const handleSelect = (next: ThemePreference) => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div
      className={`inline-flex items-center p-0.5 bg-obsidian border border-obsidian-border rounded-[2px] text-xs font-mono select-none ${className}`}
      title={`Theme: ${theme.toUpperCase()}`}
    >
      <button
        type="button"
        onClick={() => handleSelect('light')}
        aria-label="Switch to light theme"
        className={`p-1.5 rounded-[1px] transition-colors ${
          mounted && theme === 'light'
            ? 'bg-bone text-obsidian font-bold shadow-xs'
            : 'text-ink-ghost hover:text-paper'
        }`}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => handleSelect('dark')}
        aria-label="Switch to dark theme"
        className={`p-1.5 rounded-[1px] transition-colors ${
          mounted && theme === 'dark'
            ? 'bg-bone text-obsidian font-bold shadow-xs'
            : 'text-ink-ghost hover:text-paper'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => handleSelect('system')}
        aria-label="Follow system theme"
        className={`p-1.5 rounded-[1px] transition-colors ${
          mounted && theme === 'system'
            ? 'bg-bone text-obsidian font-bold shadow-xs'
            : 'text-ink-ghost hover:text-paper'
        }`}
      >
        <Laptop className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
