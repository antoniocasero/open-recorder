'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PlayerSidebar } from '@/components/PlayerSidebar'
import { InsightsSidebar } from '@/components/InsightsSidebar'
import { Footer } from '@/components/Footer'
import { Action } from '@/components/RecommendedActions'
import { SearchBar } from '@/components/SearchBar'
import { TranscriptView } from '@/components/TranscriptView'
import { scanFolderForAudio } from '@/lib/fs/commands'
import { getLastFolder } from '@/lib/fs/config'
import { readTranscript, summarizeTranscript } from '@/lib/transcription/commands'
import { extractKeyTopics } from '@/lib/transcription/insights'
import { transcriptToSegments } from '@/lib/transcription/segment'
import { AudioItem } from '@/lib/types'
import { TranscriptSegment } from '@/lib/transcription/types'

export const dynamic = 'force-dynamic'

function EditorContent({ recordingId }: { recordingId: string | null }) {
  const [recordings, setRecordings] = useState<AudioItem[]>([])
  const [selectedRecording, setSelectedRecording] = useState<AudioItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingTranscript, setLoadingTranscript] = useState(false)
  const [recordingsLoaded, setRecordingsLoaded] = useState(false)
  const [topics, setTopics] = useState<string[]>([])
  const [actions] = useState<Action[]>([
    { id: '1', title: "Review Sarah's portfolio links", description: 'Check UX design examples and case studies', completed: false },
    { id: '2', title: 'Share UX principles summary', description: 'Send key takeaways to design team', completed: false },
    { id: '3', title: 'Schedule follow‑up interview', description: 'Coordinate with HR and candidate', completed: true },
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[] | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const playerSidebarRef = useRef<{ seek: (time: number) => void }>(null)


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
        setTranscriptSegments(null)
        setSummary(null)
        setTopics([])
        setLoadingTranscript(false)
        return
      }
       // Load transcript text from sidecar .txt file
       setLoadingTranscript(true)
       try {
         const text = await readTranscript(selectedRecording.path)
         setTranscript(text)
         if (text) {
           // Convert to segments for transcript view
           const mockTranscript = {
             text,
             words: [],
             duration: selectedRecording.duration || 120,
             language: 'en'
           }
           const segments = transcriptToSegments(mockTranscript)
           setTranscriptSegments(segments)
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
           setTranscriptSegments(null)
           setTopics([])
           setSummary(null)
         }
       } finally {
         setLoadingTranscript(false)
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
      setRecordingsLoaded(true)
    }
  }

  // Filter segments based on search query
  const filteredSegments = transcriptSegments?.filter(segment =>
    segment.text.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? null

  // Calculate total word count
  const wordCount = transcriptSegments?.reduce((sum, segment) => {
    return sum + segment.text.split(/\s+/).length
  }, 0) ?? 0

  const isMissingRecording = recordingsLoaded && recordingId && !selectedRecording;

  // Handle seeking to a specific timestamp
  const handleSeek = useCallback((time: number) => {
    playerSidebarRef.current?.seek(time)
  }, [])

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {isMissingRecording ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="max-w-md text-center space-y-4">
              <span className="material-symbols-outlined text-6xl text-slate-500">
                audio_file
              </span>
              <h3 className="text-xl font-semibold text-slate-200">Recording not found</h3>
              <p className="text-slate-400">
                The recording with ID "{recordingId}" could not be found in your library.
              </p>
              <a
                href="/library"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-primary text-slate-100 text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back to Library
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Left sidebar – Player */}
            <PlayerSidebar
              ref={playerSidebarRef}
              recording={selectedRecording}
              onTimeUpdate={setCurrentTime}
            />

            {/* Main column – Transcript */}
            <main className="flex-1 flex flex-col bg-slate-deep overflow-hidden border-r border-slate-border">
              {/* Header area with search and buttons */}
              <div className="h-16 px-6 border-b border-slate-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search transcript…"
                  />
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

              {/* Transcript view */}
              <div className="p-8 flex-1 overflow-auto">
                {loadingTranscript ? (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6"></div>
                    <div className="h-4 bg-slate-800 rounded animate-pulse w-4/6"></div>
                    <div className="h-4 bg-slate-800 rounded animate-pulse w-2/3"></div>
                  </div>
                ) : (
                  <TranscriptView
                    transcript={filteredSegments}
                    currentTime={currentTime}
                    onSeek={handleSeek}
                    searchQuery={searchQuery}
                  />
                )}
              </div>
            </main>

            {/* Right sidebar – Insights */}
            <InsightsSidebar
              summary={summary}
              loadingSummary={loadingSummary}
              topics={topics}
              actions={actions}
            />
          </>
        )}
      </div>

      {/* Editor‑specific footer */}
      <Footer>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-bold text-slate-500 uppercase">
            Word count: {wordCount}
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

export default function EditorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditorPageClient />
    </Suspense>
  )
}

function EditorPageClient() {
  const searchParams = useSearchParams()
  const recordingId = searchParams.get('recording')
  return <EditorContent recordingId={recordingId} />
}