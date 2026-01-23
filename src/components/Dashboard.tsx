'use client'

import { useState, useEffect } from 'react'
import { RecordingsList } from './RecordingsList'
import { Player } from './Player'
import { Transcription } from './Transcription'
import { Settings, RefreshCw } from 'lucide-react'
import { pickFolder, scanFolderForAudio } from '@/lib/fs/commands'
import { getLastFolder, setLastFolder } from '@/lib/fs/config'
import { AudioItem } from '@/lib/types'

export function Dashboard() {
  const [recordings, setRecordings] = useState<AudioItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadLastFolder()
  }, [])

  async function loadLastFolder() {
    const lastPath = await getLastFolder()
    if (lastPath) {
      await scanFolder(lastPath)
    }
  }

  async function handleChooseFolder() {
    setLoading(true)
    try {
      const folderPath = await pickFolder()
      await scanFolder(folderPath)
      await setLastFolder(folderPath)
    } catch (err) {
      console.error('Failed to pick folder:', err)
    } finally {
      setLoading(false)
    }
  }

  async function scanFolder(folderPath: string) {
    setLoading(true)
    try {
      const items = await scanFolderForAudio(folderPath)
      setRecordings(items)
      if (items.length > 0 && !selectedId) {
        setSelectedId(items[0].id)
      }
    } catch (err) {
      console.error('Failed to scan folder:', err)
    } finally {
      setLoading(false)
    }
  }

  const selectedRecording = recordings.find(r => r.id === selectedId)

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Recordings</h1>
          <p className="text-sm text-gray-400 mt-1">{recordings.length} recordings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-md border border-[#333]">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-gray-300">Synced just now</span>
          </div>
          <button 
            onClick={handleChooseFolder}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#252525] rounded-md border border-[#333] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Sync Device</span>
          </button>
          <button className="p-2 bg-[#252525] rounded-md border border-[#333] hover:bg-[#2a2a2a] transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-[400px_1fr] gap-6 mb-6">
        <RecordingsList 
          recordings={recordings}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <Player recording={selectedRecording} />
      </div>

      {/* Transcription */}
      <Transcription />
    </div>
  )
}
