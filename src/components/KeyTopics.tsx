'use client'

interface KeyTopicsProps {
  topics: string[]
}

export function KeyTopics({ topics }: KeyTopicsProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-200">Key Topics</h4>
      <div className="flex flex-wrap gap-2">
        {topics.length > 0 ? (
          topics.map((topic, idx) => (
            <span
              key={idx}
              className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[11px] text-slate-300"
            >
              {topic}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500 italic">No topics extracted</p>
        )}
      </div>
    </div>
  )
}