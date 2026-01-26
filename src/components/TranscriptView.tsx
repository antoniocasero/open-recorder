'use client'

import { TranscriptSegment } from '@/lib/transcription/types'
import { formatTimestamp } from '@/lib/transcription/segment'

interface TranscriptViewProps {
  transcript: TranscriptSegment[] | null
  currentTime?: number
  onSeek?: (time: number) => void
  searchQuery?: string
}

export function TranscriptView({ transcript, currentTime = 0, onSeek, searchQuery = '' }: TranscriptViewProps) {
  // If no transcript data
  if (!transcript || transcript.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No transcript available</p>
        <p className="text-sm mt-2">Transcribe this recording to see speaker‑segmented text.</p>
      </div>
    )
  }

  // Helper to highlight search matches within text
  const highlightMatches = (text: string, query: string) => {
    if (!query.trim()) {
      return <span className="text-slate-300">{text}</span>
    }
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    return (
      <>
        {parts.map((part, idx) =>
          regex.test(part) ? (
            <mark
              key={idx}
              className="bg-indigo-primary/20 text-indigo-primary px-1 rounded font-semibold border border-indigo-primary/30"
            >
              {part}
            </mark>
          ) : (
            <span key={idx}>{part}</span>
          )
        )}
      </>
    )
  }

  return (
    <div className="space-y-4 p-4 max-w-3xl mx-auto">
      {transcript.map((segment, idx) => {
        const isActive = currentTime >= segment.start && currentTime < segment.end
        const isInterviewer = segment.speaker === 'Interviewer'

        return (
          <div
            key={idx}
            className={`flex gap-4 p-3 rounded-lg transition-colors ${
              isActive ? 'bg-slate-800/40 border-l-2 border-indigo-primary' : 'hover:bg-slate-800/20'
            }`}
          >
            {/* Timestamp button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => onSeek?.(segment.start)}
                className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
                  isActive
                    ? 'bg-indigo-primary text-slate-100 border-indigo-primary'
                    : 'bg-slate-800/50 text-slate-400 border-slate-border hover:bg-slate-700/50'
                }`}
                title={`Seek to ${formatTimestamp(segment.start)}`}
              >
                {formatTimestamp(segment.start)}
              </button>
            </div>

            {/* Speaker label and text */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {/* Colored dot */}
                <div
                  className={`w-2 h-2 rounded-full ${
                    isInterviewer ? 'bg-slate-500' : 'bg-indigo-primary'
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isInterviewer ? 'text-slate-500' : 'text-indigo-primary'
                  }`}
                >
                  {segment.speaker}
                </span>
              </div>
              <div className="text-sm leading-relaxed">
                {highlightMatches(segment.text, searchQuery)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}