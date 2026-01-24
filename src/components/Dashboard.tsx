'use client'

import { useState, useEffect } from 'react'
import { RecordingsList } from './RecordingsList'
import { Player } from './Player'
import { Transcription } from './Transcription'
import { Settings, RefreshCw, Search } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { pickFolder, scanFolderForAudio } from '@/lib/fs/commands'
import { getLastFolder, setLastFolder } from '@/lib/fs/config'
import { AudioItem } from '@/lib/types'

export function Dashboard() {
  const [recordings, setRecordings] = useState<AudioItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string[]>([])

  // Basic search - will be replaced with transcript search in Task 3
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const query = searchQuery.toLowerCase()
    const results = recordings.filter(r => 
      r.name.toLowerCase().includes(query)
    ).map(r => r.id)
    setSearchResults(results)
  }, [searchQuery, recordings])

  useEffect(() => {
    loadLastFolder()
  }, [])

  // Mock recording for development testing
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && recordings.length === 0) {
      console.log('[DEV] Adding mock recording for testing')
      const mockRecording: AudioItem = {
        id: 'mock-1',
        name: 'sample-recording.mp3',
        path: '/path/to/sample.mp3',
        size: 1024 * 1024 * 5, // 5 MB
        mtime: Date.now(),
        duration: 120 // 2 minutes
      }
      setRecordings([mockRecording])
      setSelectedId('mock-1')
    }
  }, [recordings.length])

  const filteredRecordings = searchQuery.trim() 
    ? recordings.filter(r => searchResults.includes(r.id))
    : recordings

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
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery.trim() ? `${filteredRecordings.length} of ${recordings.length} recordings` : `${recordings.length} recordings`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transcripts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#252525] rounded-md border border-[#333] text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500 w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
            {searchQuery && searchResults.length > 0 && (
              <span className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-400 whitespace-nowrap">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 mb-6">
        <RecordingsList 
          recordings={filteredRecordings}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <Player recording={selectedRecording} />
      </div>

      {/* Transcription */}
      <Transcription />
      <Toaster position="bottom-right" />
    </div>
  )
}
