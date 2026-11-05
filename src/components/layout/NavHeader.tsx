'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, FileText, Users, Settings, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { logoutAction } from '@/app/(auth)/actions';

interface NavHeaderProps {
  companyName: string;
}

export function NavHeader({ companyName }: NavHeaderProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/invoices',
      label: 'Invoices',
      icon: FileText,
      isActive: pathname === '/invoices' || (pathname.startsWith('/invoices/') && pathname !== '/invoices/new'),
    },
    {
      href: '/clients',
      label: 'Clients',
      icon: Users,
      isActive: pathname.startsWith('/clients'),
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      isActive: pathname.startsWith('/settings'),
    },
  ];

  return (
    <header className="border-b border-obsidian-border bg-obsidian-light sticky top-0 z-40">
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
        {/* Primary Header Row */}
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand + Desktop Nav */}
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            <Link href="/invoices" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-status-brass shrink-0 group-hover:scale-110 transition-transform" />
              <div className="min-w-0">
                <span className="font-serif text-base sm:text-lg 2xl:text-xl font-bold tracking-tight text-paper block leading-none truncate">
                  The Architect&apos;s Ledger
                </span>
                <span className="font-mono text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-ink-ghost block mt-0.5 truncate max-w-[160px] sm:max-w-[260px]">
                  {companyName}
                </span>
              </div>
            </Link>

            {/* Tablet / Desktop / TV Navigation Links */}
            <nav
              aria-label="Primary Navigation"
              className="hidden md:flex items-center gap-1 font-mono text-xs 2xl:text-sm uppercase tracking-wider"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-[1px] transition-colors flex items-center gap-1.5 ${
                      item.isActive
                        ? 'bg-obsidian border border-obsidian-border text-paper font-bold shadow-xs'
                        : 'text-bone-dark hover:text-paper hover:bg-obsidian-border/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ThemeToggle />

            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-mono uppercase tracking-wider text-obsidian bg-bone hover:bg-paper font-semibold rounded-[2px] transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline sm:inline">Draft Invoice</span>
              <span className="inline xs:hidden sm:hidden">New</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                title="Sign Out"
                aria-label="Sign Out"
                className="p-1.5 text-ink-ghost hover:text-status-vermilion transition-colors rounded-[1px]"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Navigation Strip (Visible on iPhone / Android < 768px) */}
        <nav
          aria-label="Mobile Navigation"
          className="md:hidden grid grid-cols-3 gap-1 py-1.5 border-t border-obsidian-border/70 font-mono text-[11px] uppercase tracking-wider"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`py-2 px-2 rounded-[1px] flex items-center justify-center gap-1.5 transition-colors ${
                  item.isActive
                    ? 'bg-bone text-obsidian font-bold shadow-xs'
                    : 'text-bone-dark hover:text-paper active:bg-obsidian-border/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
