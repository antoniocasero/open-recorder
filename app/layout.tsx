import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Open Recorder',
  description: 'Audio recording manager',
}

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex flex-col h-screen bg-slate-deep text-slate-muted">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
        {/* Footer will be provided by each page */}
      </body>
    </html>
  )
}
