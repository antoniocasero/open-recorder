'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { PlayerSidebar } from '@/components/PlayerSidebar'
import { InsightsSidebar } from '@/components/InsightsSidebar'
import { Footer } from '@/components/Footer'
import { Action } from '@/components/RecommendedActions'
import { scanFolderForAudio } from '@/lib/fs/commands'
import { getLastFolder } from '@/lib/fs/config'
import { readTranscript, summarizeTranscript } from '@/lib/transcription/commands'
import { extractKeyTopics } from '@/lib/transcription/insights'
import { AudioItem } from '@/lib/types'

export default function EditorPage() {
  const [recordings, setRecordings] = useState<AudioItem[]>([])
  const [selectedRecording, setSelectedRecording] = useState<AudioItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [topics, setTopics] = useState<string[]>([])
  const [actions] = useState<Action[]>([
    { id: '1', title: "Review Sarah's portfolio links", description: 'Check UX design examples and case studies', completed: false },
    { id: '2', title: 'Share UX principles summary', description: 'Send key takeaways to design team', completed: false },
    { id: '3', title: 'Schedule follow‑up interview', description: 'Coordinate with HR and candidate', completed: true },
  ])
  const searchParams = useSearchParams()
  const recordingId = searchParams.get('recording')

  // Load recordings from last folder
  useEffect(() => {
    loadRecordings()
  }, [])

  // Update selected recording when ID changes
  useEffect(() => {
    if (recordings.length > 0 && recordingId) {
      const found = recordings.find(r => r.id === recordingId)
      setSelectedRecording(found || null)
    } else {
      setSelectedRecording(null)
    }
  }, [recordings, recordingId])

  // Load transcript and insights when a recording is selected
  useEffect(() => {
    async function loadInsights() {
      if (!selectedRecording) {
        setTranscript(null)
        setSummary(null)
        setTopics([])
        return
      }
      // Load transcript text from sidecar .txt file
      const text = await readTranscript(selectedRecording.path)
      setTranscript(text)
      if (text) {
        // Extract key topics
        const extracted = extractKeyTopics(text)
        setTopics(extracted)
        // Generate AI summary if text is not empty
        setLoadingSummary(true)
        try {
          const result = await summarizeTranscript(text)
          setSummary(result)
        } catch (error) {
          console.warn('Could not generate AI summary:', error)
          // Keep summary as null (component will show placeholder)
        } finally {
          setLoadingSummary(false)
        }
      } else {
        setTopics([])
        setSummary(null)
      }
    }
    loadInsights()
  }, [selectedRecording])

  async function loadRecordings() {
    setLoading(true)
    try {
      const lastPath = await getLastFolder()
      if (lastPath) {
        const items = await scanFolderForAudio(lastPath)
        setRecordings(items)
      } else {
        // No folder selected yet; in development add a mock
        if (process.env.NODE_ENV === 'development') {
          const mockRecording: AudioItem = {
            id: 'mock-1',
            name: 'sample-recording.mp3',
            path: '/path/to/sample.mp3',
            size: 1024 * 1024 * 5, // 5 MB
            mtime: Math.floor(Date.now() / 1000),
            duration: 120 // 2 minutes
          }
          setRecordings([mockRecording])
          // If URL has no recording param, select the mock
          if (!recordingId) {
            setSelectedRecording(mockRecording)
          }
        }
      }
    } catch (err) {
      console.error('Failed to load recordings:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar – Player */}
        <PlayerSidebar recording={selectedRecording} />

        {/* Main column – Transcript */}
        <main className="flex-1 flex flex-col bg-slate-deep overflow-hidden border-r border-slate-border">
          {/* Header area with search and buttons */}
          <div className="h-16 px-6 border-b border-slate-border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search transcript…"
                  className="pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-border rounded-lg text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 border border-slate-border text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-surface transition-colors">
                <span className="material-symbols-outlined align-middle mr-2">edit</span>
                Edit
              </button>
              <button className="px-4 py-2 bg-indigo-primary text-slate-100 text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors">
                <span className="material-symbols-outlined align-middle mr-2">download</span>
                Export
              </button>
            </div>
          </div>

          {/* Transcript placeholder */}
          <div className="p-8 flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Transcript</h2>
              <p className="text-slate-400">
                Transcript content will appear here once a recording is selected and transcribed.
                The text will be synchronized with the audio playback, allowing you to navigate by
                clicking on words or phrases.
              </p>
            </div>
          </div>
        </main>

        {/* Right sidebar – Insights */}
        <InsightsSidebar
          summary={summary}
          loadingSummary={loadingSummary}
          topics={topics}
          actions={actions}
        />
      </div>

      {/* Editor‑specific footer */}
      <Footer>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Word count: 0
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Language: EN‑US
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Auto‑scroll: Off
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            ⌘K for shortcuts
          </span>
        </div>
      </Footer>
    </>
  )
}