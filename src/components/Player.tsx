'use client'

import { Pause } from 'lucide-react'
import { AudioItem } from '@/lib/types'

interface PlayerProps {
  recording?: AudioItem
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
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

export function Player({ recording }: PlayerProps) {
  if (!recording) {
    return (
      <div className="bg-[#252525] rounded-lg border border-[#333] p-6 flex items-center justify-center h-[400px]">
        <p className="text-gray-400 text-sm">Select a recording to play</p>
      </div>
    )
  }

  return (
    <div className="bg-[#252525] rounded-lg border border-[#333] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{recording.name}</h2>
        <p className="text-sm text-gray-400 mt-1">{formatDate(recording.mtime)}</p>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Play/Pause Button */}
        <button className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 flex items-center justify-center shadow-lg transition-all">
          <Pause className="w-7 h-7 text-white" fill="white" />
        </button>

        {/* Waveform */}
        <div className="w-full flex items-center justify-center gap-0.5 h-24">
          {Array.from({ length: 80 }).map((_, i) => {
            const height = Math.random() * 60 + 20
            const isPlayed = i < 30
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-colors ${
                  isPlayed ? 'bg-orange-500' : 'bg-gray-600'
                }`}
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>

        {/* Time */}
        <div className="w-full flex justify-between text-sm text-gray-400">
          <span>0:00</span>
          <span>{formatDuration(recording.duration)}</span>
        </div>
      </div>
    </div>
  )
}
