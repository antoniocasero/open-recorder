'use client'

import { RecordingsList } from './RecordingsList'
import { Player } from './Player'
import { Transcription } from './Transcription'
import { Settings, RefreshCw } from 'lucide-react'

export function Dashboard() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Recordings</h1>
          <p className="text-sm text-gray-400 mt-1">3 recordings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-md border border-[#333]">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-300">Synced just now</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#252525] rounded-md border border-[#333] hover:bg-[#2a2a2a] transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">Sync Device</span>
          </button>
          <button className="p-2 bg-[#252525] rounded-md border border-[#333] hover:bg-[#2a2a2a] transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-[400px_1fr] gap-6 mb-6">
        <RecordingsList />
        <Player />
      </div>

      {/* Transcription */}
      <Transcription />
    </div>
  )
}
