'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { name: 'Library', href: '/library' },
    { name: 'Editor', href: '/editor' },
    { name: 'Insights', href: '/insights' },
  ];

  const isActive = (href: string) => {
    // Exact match for now, could be improved for nested routes
    return pathname === href;
  };

  return (
    <header className="h-16 bg-slate-deep/80 backdrop-blur-md border-b border-slate-border px-6 flex items-center justify-between">
      {/* Logo area */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-2xl text-indigo-primary">
          graphic_eq
        </span>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-slate-100 leading-none">
            Open Recorder
          </span>
          <span className="text-xs text-slate-500 leading-none">
            Transcription Suite
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={`text-sm font-medium transition-colors border-b-2 ${
              isActive(link.href)
                ? 'border-indigo-primary text-slate-100'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      {/* User area */}
      <div className="flex items-center gap-4 min-w-[160px] justify-end">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full"></div>
        </div>
      </div>
    </header>
  );
}
