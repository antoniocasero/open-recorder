'use client'

import { Play, Clock, HardDrive, Loader, FileText } from 'lucide-react'
import { useState } from 'react'
import { AudioItem } from '@/lib/types'
import { transcribeAudio } from '@/lib/transcription/commands'
import { TranscriptionState, Transcript } from '@/lib/transcription/types'
import toast, { Toaster } from 'react-hot-toast'
import { TranscriptionModal } from './TranscriptionModal'

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
  const [showTranscriptModal, setShowTranscriptModal] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState<Transcript | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleBatchTranscribe = async () => {
    console.log('Batch transcribe selected:', Array.from(selectedIds))
    // TODO: implement batch transcription
  }

  const selectAll = () => {
    if (selectedIds.size === recordings.length) {
      // Deselect all
      setSelectedIds(new Set())
    } else {
      // Select all
      setSelectedIds(new Set(recordings.map(r => r.id)))
    }
  }

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
      
      // Show success toast
      toast.success('Transcription complete!', {
        duration: 4000,
      })
      
      // Open modal with transcript
      setCurrentTranscript(transcript)
      setShowTranscriptModal(true)
    } catch (error) {
      setTranscriptionStates(prev => ({
        ...prev,
        [recording.id]: { status: 'error', error: error instanceof Error ? error.message : String(error) }
      }))
      
      // Show error toast
      toast.error(`Transcription failed: ${error instanceof Error ? error.message : String(error)}`, {
        duration: 5000,
      })
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
    <>
        <div className="bg-[#252525] rounded-lg border border-[#333] p-4">
          {/* Header with batch controls */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#333]">
              <div className="text-sm text-gray-300">
                {selectedIds.size} recording{selectedIds.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="px-3 py-1 text-xs bg-[#2a2a2a] rounded border border-[#333] hover:bg-[#333] transition-colors"
                >
                  {selectedIds.size === recordings.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleBatchTranscribe}
                  className="px-3 py-1 text-xs bg-orange-600 rounded border border-orange-700 hover:bg-orange-700 transition-colors"
                >
                  Transcribe Selected
                </button>
              </div>
            </div>
          )}
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
                <input
                  type="checkbox"
                  checked={selectedIds.has(recording.id)}
                  onChange={(e) => {
                    e.stopPropagation()
                    toggleSelection(recording.id)
                  }}
                  className="w-4 h-4 accent-orange-500 flex-shrink-0 mt-1"
                />
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
                    {transcriptionStates[recording.id]?.status === 'error' ? (
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-xs text-red-400">
                          {transcriptionStates[recording.id].error?.substring(0, 30)}…
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTranscribe(recording)
                          }}
                          className="px-2 py-1 text-xs bg-red-900/30 border border-red-800 rounded hover:bg-red-900/50"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      {showTranscriptModal && currentTranscript && (
        <TranscriptionModal
          transcript={currentTranscript}
          onClose={() => {
            setShowTranscriptModal(false)
            setCurrentTranscript(null)
          }}
        />
      )}
    </>
  )
}
