'use client'

import { AISummary } from './AISummary'
import { RecommendedActions, Action } from './RecommendedActions'
import { KeyTopics } from './KeyTopics'

interface InsightsSidebarProps {
  summary: string | null
  actions?: Action[]
  onActionsChange?: (actions: Action[]) => void
  topics: string[]
  loadingSummary?: boolean
}

export function InsightsSidebar({
  summary,
  actions,
  onActionsChange,
  topics,
  loadingSummary = false,
}: InsightsSidebarProps) {
  return (
    <aside className="w-[360px] flex flex-col bg-slate-deep overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="p-6 border-b border-slate-border">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-primary">
            auto_awesome
          </span>
          <h3 className="text-lg font-semibold text-slate-200">AI Insights</h3>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          AI‑generated insights, summaries, and action items.
        </p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        <AISummary summary={summary} loading={loadingSummary} />
        <RecommendedActions actions={actions} onChange={onActionsChange} />
        <KeyTopics topics={topics} />
      </div>
    </aside>
  )
}
