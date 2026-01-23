'use client'

import { Pause } from 'lucide-react'

export function Player() {
  return (
    <div className="bg-[#252525] rounded-lg border border-[#333] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Weekly Team Sync.mp3</h2>
        <p className="text-sm text-gray-400 mt-1">Today at 10:00 AM</p>
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
          <span>12:45</span>
          <span>45:20</span>
        </div>
      </div>
    </div>
  )
}
