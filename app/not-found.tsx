'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-slate-200">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">The page you tried to open does not exist.</p>
        <Link
          href="/library"
          className="mt-6 inline-flex items-center justify-center rounded-md border border-slate-border bg-slate-surface px-4 py-2 text-sm text-slate-200 hover:bg-slate-surface/80"
        >
          Go to Library
        </Link>
      </div>
    </div>
  )
}
