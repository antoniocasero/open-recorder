'use client'

interface AISummaryProps {
  summary: string | null
  loading?: boolean
}

export function AISummary({ summary, loading = false }: AISummaryProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">AI Summary</h4>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xs text-slate-400">
            auto_awesome
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
            Generated
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-slate-900/40 rounded-xl p-4 border border-slate-border/50">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 bg-slate-800 rounded animate-pulse"></div>
            <div className="h-3 bg-slate-800 rounded animate-pulse w-5/6"></div>
            <div className="h-3 bg-slate-800 rounded animate-pulse w-4/6"></div>
          </div>
        ) : summary ? (
          <p className="text-sm text-slate-300 leading-relaxed">{summary}</p>
        ) : (
          <p className="text-sm text-slate-500 italic">No summary available</p>
        )}
      </div>
    </div>
  )
}