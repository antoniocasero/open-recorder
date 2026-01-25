import { ReactNode } from 'react';

interface FooterProps {
  children: ReactNode;
}

export function Footer({ children }: FooterProps) {
  return (
    <footer className="h-10 border-t border-slate-border bg-slate-900/50 px-6 flex items-center justify-between">
      {children}
    </footer>
  );
}