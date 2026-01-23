'use client'

import { Play, Clock, HardDrive } from 'lucide-react'

const mockRecordings = [
  { id: '1', name: 'Weekly Team Sync.mp3', duration: '45:20', size: '24.5 MB', selected: true },
  { id: '2', name: 'Product Roadmap.mp3', duration: '1:15:00', size: '42.1 MB', selected: false },
  { id: '3', name: 'Client Interview.mp3', duration: '22:15', size: '12.8 MB', selected: false },
]

export function RecordingsList() {
  return (
    <div className="bg-[#252525] rounded-lg border border-[#333] p-4">
      <div className="space-y-2">
        {mockRecordings.map((recording) => (
          <div
            key={recording.id}
            className={`relative flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors ${
              recording.selected
                ? 'bg-[#2a2a2a] border-l-2 border-l-orange-500'
                : 'hover:bg-[#2a2a2a]'
            }`}
          >
            <Play className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{recording.name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {recording.duration}
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  {recording.size}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
