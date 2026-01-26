'use client'

import { forwardRef, useMemo } from 'react'
import { AudioItem } from '@/lib/types'
import { Player } from './Player'

interface PlayerSidebarHandle {
  seek: (time: number) => void
}

interface PlayerSidebarProps {
  recording: AudioItem | null
  currentTime?: number
  onTimeUpdate?: (time: number) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  
  if (isToday) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const PlayerSidebar = forwardRef<PlayerSidebarHandle, PlayerSidebarProps>(
  ({ recording, currentTime = 0, onTimeUpdate }, ref) => {
    // If no recording, show placeholder
    if (!recording) {
      return (
        <div className="w-[320px] bg-slate-900/50 border border-slate-border rounded-2xl p-6 flex flex-col items-center justify-center">
          <p className="text-slate-400 text-sm">Select a recording to play</p>
        </div>
      )
    }

    // Generate waveform bars (20–100% height, active based on progress)
    const duration = recording.duration || 0
    const progress = duration > 0 ? currentTime / duration : 0
    const activeBars = Math.floor(progress * 18)

    const barHeights = useMemo(() => 
      Array.from({ length: 18 }, () => Math.floor(Math.random() * 80) + 20),
      [recording.id]
    )

    const bars = barHeights.map((height, i) => ({
      height,
      active: i < activeBars,
    }))

    return (
      <div className="w-[320px] bg-slate-900/50 border border-slate-border rounded-2xl p-6 flex flex-col gap-6">
        {/* Title section */}
        <div>
          <h2 className="text-xl font-semibold text-slate-100 truncate">
            {recording.name}
          </h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">calendar_today</span>
              <span>{formatDate(recording.mtime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">database</span>
              <span>{formatFileSize(recording.size)}</span>
            </div>
          </div>
        </div>

        {/* Waveform visualization */}
        <div className="flex flex-col gap-2">
          <div className="flex items-end justify-between gap-1 h-32">
            {bars.map((bar, i) => (
              <div
                key={i}
                className={`waveform-bar ${bar.active ? 'active' : ''}`}
                style={{
                  width: '4px',
                  height: `${bar.height}%`,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-slate-400">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Player controls */}
        <div className="flex justify-center">
          <Player ref={ref} recording={recording} onTimeUpdate={onTimeUpdate} />
        </div>
      </div>
    )
  }
)