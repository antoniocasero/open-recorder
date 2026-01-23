'use client'

import { Play, Clock, HardDrive, Loader, FileText } from 'lucide-react'
import { useState } from 'react'
import { AudioItem } from '@/lib/types'
import { transcribeAudio } from '@/lib/transcription/commands'
import { TranscriptionState } from '@/lib/transcription/types'

interface RecordingsListProps {
  recordings: AudioItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatSize(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}

export function RecordingsList({ recordings, selectedId, onSelect }: RecordingsListProps) {
  const [transcriptionStates, setTranscriptionStates] = useState<Record<string, TranscriptionState>>({})

  const handleTranscribe = async (recording: AudioItem) => {
    setTranscriptionStates(prev => ({
      ...prev,
      [recording.id]: { status: 'loading' }
    }))
    
    try {
      const transcript = await transcribeAudio(recording.path)
      setTranscriptionStates(prev => ({
        ...prev,
        [recording.id]: { status: 'success', transcript }
      }))
      // Toast will be added in a later plan
    } catch (error) {
      setTranscriptionStates(prev => ({
        ...prev,
        [recording.id]: { status: 'error', error: error instanceof Error ? error.message : String(error) }
      }))
    }
  }

  if (recordings.length === 0) {
    return (
      <div className="bg-[#252525] rounded-lg border border-[#333] p-4 flex items-center justify-center h-[400px]">
        <p className="text-gray-400 text-sm">No recordings found. Click "Sync Device" to choose a folder.</p>
      </div>
    )
  }

  return (
    <div className="bg-[#252525] rounded-lg border border-[#333] p-4">
      <div className="space-y-2">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            onClick={() => onSelect(recording.id)}
            className={`relative flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors ${
              recording.id === selectedId
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
                  {formatDuration(recording.duration)}
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  {formatSize(recording.size)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleTranscribe(recording)
                  }}
                  disabled={transcriptionStates[recording.id]?.status === 'loading'}
                  className="flex items-center gap-1 ml-auto px-2 py-1 bg-[#2a2a2a] rounded border border-[#333] hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {transcriptionStates[recording.id]?.status === 'loading' ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
                  <span className="text-xs">
                    {transcriptionStates[recording.id]?.status === 'loading' ? 'Transcribing...' : 'Transcribe'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
