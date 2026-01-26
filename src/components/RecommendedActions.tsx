'use client'

import { useState } from 'react'

export interface Action {
  id: string
  title: string
  description: string
  completed: boolean
}

interface RecommendedActionsProps {
  actions?: Action[]
}

const defaultActions: Action[] = [
  {
    id: '1',
    title: "Review Sarah's portfolio links",
    description: 'Check UX design examples and case studies',
    completed: false,
  },
  {
    id: '2',
    title: 'Share UX principles summary',
    description: 'Send key takeaways to design team',
    completed: false,
  },
  {
    id: '3',
    title: 'Schedule follow‑up interview',
    description: 'Coordinate with HR and candidate',
    completed: true,
  },
]

export function RecommendedActions({ actions }: RecommendedActionsProps) {
  const [items, setItems] = useState<Action[]>(actions || defaultActions)

  const toggleCompleted = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-200">Recommended Actions</h4>
        <button
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          title="Add task (non-functional)"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Add Task</span>
        </button>
      </div>

      {/* Actions list */}
      <div className="space-y-2">
        {items.map(item => (
          <div
            key={item.id}
            className="bg-slate-900/40 p-3 rounded-xl border border-slate-border/50 hover:border-indigo-primary/30 transition-colors cursor-pointer group"
            onClick={() => toggleCompleted(item.id)}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <div className="flex-shrink-0">
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    item.completed
                      ? 'bg-indigo-primary border-indigo-primary'
                      : 'border-slate-500 group-hover:border-slate-400'
                  }`}
                >
                  {item.completed && (
                    <span className="material-symbols-outlined text-xs text-white">
                      check
                    </span>
                  )}
                </div>
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <h5
                  className={`text-[13px] font-medium ${
                    item.completed
                      ? 'text-slate-500 line-through'
                      : 'text-slate-200'
                  }`}
                >
                  {item.title}
                </h5>
                <p className="text-[10px] text-slate-500 mt-1">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}