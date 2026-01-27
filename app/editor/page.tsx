'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { PlayerSidebar } from '@/components/PlayerSidebar'
import { InsightsSidebar } from '@/components/InsightsSidebar'
import { Footer } from '@/components/Footer'
import { TranscriptionModal } from '@/components/TranscriptionModal'
import { Action } from '@/components/RecommendedActions'
import { SearchBar } from '@/components/SearchBar'
import { TranscriptView } from '@/components/TranscriptView'
import { scanFolderForAudio } from '@/lib/fs/commands'
import { getLastFolder, getEditorActionsCompletion, setEditorActionsCompletion, getEditorState, setEditorState } from '@/lib/fs/config'
import { DEFAULT_EDITOR_STATE, EditorUiState } from '@/lib/editor/state'
import { readTranscript, summarizeTranscript, recommendActions, extractKeyTopicsAI, getTranscriptInsights } from '@/lib/transcription/commands'
import { extractKeyTopics, extractRecommendedActions, normalizeTopics } from '@/lib/transcription/insights'
import { transcriptToSegments } from '@/lib/transcription/segment'
import { downloadFile } from '@/lib/transcription/export'
import { AudioItem } from '@/lib/types'
import { TranscriptSegment } from '@/lib/transcription/types'
import toast from 'react-hot-toast'

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
  const [actions, setActions] = useState<Action[]>([])

  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(DEFAULT_EDITOR_STATE.leftSidebarCollapsed)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(DEFAULT_EDITOR_STATE.rightSidebarCollapsed)
  const [searchQuery, setSearchQuery] = useState(DEFAULT_EDITOR_STATE.searchQuery)
  const [exportFormat, setExportFormat] = useState<EditorUiState['exportFormat']>(DEFAULT_EDITOR_STATE.exportFormat)
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[] | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const playerSidebarRef = useRef<{ seek: (time: number) => void }>(null)
  const hydrationCompleteRef = useRef(false)

  function actionIdFromContent(title: string, description: string): string {
    // FNV-1a 32-bit hash for stable, deterministic IDs without dependencies
    const str = `${title}\n${description}`
    let hash = 2166136261
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
    return `action_${(hash >>> 0).toString(16)}`
  }

  async function mergeActionsWithSavedCompletion(
    recordingPath: string,
    nextActions: Action[],
  ): Promise<Action[]> {
    try {
      const completion = await getEditorActionsCompletion(recordingPath)
      return nextActions.map((a) => ({ ...a, completed: completion[a.id] ?? a.completed }))
    } catch {
      // Persistence is best-effort; render actions even if store fails.
      return nextActions
    }
  }

  async function persistActionCompletion(recordingPath: string, nextActions: Action[]): Promise<void> {
    const completion = nextActions.reduce<Record<string, boolean>>((acc, a) => {
      acc[a.id] = Boolean(a.completed)
      return acc
    }, {})

    await setEditorActionsCompletion(recordingPath, completion)
  }

  // Hydrate editor UI state from persistent storage
  useEffect(() => {
    async function hydrate() {
      const saved = await getEditorState()
      setLeftSidebarCollapsed(saved.leftSidebarCollapsed)
      setRightSidebarCollapsed(saved.rightSidebarCollapsed)
      setSearchQuery(saved.searchQuery)
      setExportFormat(saved.exportFormat)
      hydrationCompleteRef.current = true
    }
    hydrate()
  }, [])

  // Persist editor UI state on change
  useEffect(() => {
    if (!hydrationCompleteRef.current) return
    setEditorState({
      leftSidebarCollapsed,
      rightSidebarCollapsed,
      searchQuery,
      exportFormat,
    })
  }, [leftSidebarCollapsed, rightSidebarCollapsed, searchQuery, exportFormat])

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
        setActions([])
        setLoadingTranscript(false)
        return
      }
       // Load transcript text from sidecar .txt file
        setLoadingTranscript(true)
        try {
          console.log(`Reading transcript for: ${selectedRecording.path}`)
          const startTime = Date.now()
          const text = await readTranscript(selectedRecording.path)
          console.log(`Transcript read in ${Date.now() - startTime}ms, length: ${text?.length || 0} chars`)
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
             // Try unified insights first (cached, parallel generation)
            try {
              console.log('Getting unified transcript insights...')
              const startTime = Date.now()
              const insights = await getTranscriptInsights(text)
              console.log(`Unified insights received in ${Date.now() - startTime}ms`, {
                hasSummary: !!insights.summary,
                hasActions: !!insights.actions,
                hasTopics: !!insights.topics,
                topicsCount: insights.topics?.length || 0,
                actionsCount: insights.actions?.length || 0
              })
              
              if (insights.topics) {
                setTopics(normalizeTopics(insights.topics))
              }
              if (insights.summary) {
                setSummary(insights.summary)
              }
               if (insights.actions) {
                 const derivedActions = insights.actions.length > 0
                   ? insights.actions
                   : extractRecommendedActions(text)

                 const normalized: Action[] = derivedActions.map((action) => ({
                   id: actionIdFromContent(action.title, action.description),
                   title: action.title,
                   description: action.description,
                   completed: false,
                 }))

                 const merged = await mergeActionsWithSavedCompletion(selectedRecording.path, normalized)
                 setActions(merged)
               }
              // If any field missing (shouldn't happen), fall through to separate generation
              if (insights.topics && insights.summary && insights.actions) {
                // All fields present, we're done
                setLoadingSummary(false)
                return
              }
             } catch (error) {
              console.warn('Could not generate unified insights:', error)
              console.log('Falling back to separate AI calls')
              // Fall back to separate AI calls
            }
            
             // Generate AI summary if text is not empty (fallback if unified failed or missing fields)
            setLoadingSummary(true)
            try {
              console.log('Falling back to separate summary generation...')
              const startTime = Date.now()
              const result = await summarizeTranscript(text)
              console.log(`Summary generated in ${Date.now() - startTime}ms`)
              setSummary(result)
            } catch (error) {
              console.warn('Could not generate AI summary:', error)
              // Keep summary as null (component will show placeholder)
            } finally {
              setLoadingSummary(false)
            }

            // Extract key topics (fallback if unified failed or missing fields)
            try {
              console.log('Falling back to separate topics generation...')
              const startTime = Date.now()
              const aiTopics = await extractKeyTopicsAI(text)
              console.log(`Topics generated in ${Date.now() - startTime}ms`)
              setTopics(normalizeTopics(aiTopics))
            } catch (error) {
              console.warn('Could not generate AI key topics:', error)
              const extracted = extractKeyTopics(text)
              setTopics(normalizeTopics(extracted))
            }

            // Generate AI actions (fallback if unified failed or missing fields)
            try {
              console.log('Falling back to separate actions generation...')
              const startTime = Date.now()
              const aiActions = await recommendActions(text)
              console.log(`Actions generated in ${Date.now() - startTime}ms`)
               const derivedActions = aiActions.length > 0
                 ? aiActions
                 : extractRecommendedActions(text)

               const normalized: Action[] = derivedActions.map((action) => ({
                 id: actionIdFromContent(action.title, action.description),
                 title: action.title,
                 description: action.description,
                 completed: false,
               }))

               const merged = await mergeActionsWithSavedCompletion(selectedRecording.path, normalized)
               setActions(merged)
             } catch (error) {
               console.warn('Could not generate AI actions:', error)
               const fallback = extractRecommendedActions(summary || text)
               const normalized: Action[] = fallback.map((action) => ({
                 id: actionIdFromContent(action.title, action.description),
                 title: action.title,
                 description: action.description,
                 completed: Boolean(action.completed),
               }))
               const merged = await mergeActionsWithSavedCompletion(selectedRecording.path, normalized)
               setActions(merged)
             }
          } else {
            setTranscriptSegments(null)
            setTopics([])
            setSummary(null)
            setActions([])
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

  // Export functions
  const handleExportTXT = async () => {
    if (!transcript) {
      toast.error('No transcript available to export')
      setShowExportDropdown(false)
      return
    }
    const filename = `transcript_${selectedRecording?.name.replace(/\.[^/.]+$/, '') || 'recording'}.txt`
    setExportFormat('txt')
    try {
      await downloadFile(transcript, filename)
      toast.success('Exported TXT')
    } catch (error) {
      toast.error(`Export failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setShowExportDropdown(false)
    }
  }

  const handleExportSRT = async () => {
    if (!transcriptSegments || transcriptSegments.length === 0) {
      toast.error('No transcript available to export')
      setShowExportDropdown(false)
      return
    }
    // Generate SRT from segments
    let srtContent = ''
    transcriptSegments.forEach((segment, index) => {
      const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        const millis = Math.round((secs - Math.floor(secs)) * 1000)
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`
      }
      srtContent += `${index + 1}\n`
      srtContent += `${formatTime(segment.start)} --> ${formatTime(segment.end)}\n`
      srtContent += `${segment.text}\n\n`
    })
    const filename = `transcript_${selectedRecording?.name.replace(/\.[^/.]+$/, '') || 'recording'}.srt`
    setExportFormat('srt')
    try {
      await downloadFile(srtContent, filename)
      toast.success('Exported SRT')
    } catch (error) {
      toast.error(`Export failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setShowExportDropdown(false)
    }
  }

  const handleExportVTT = async () => {
    if (!transcriptSegments || transcriptSegments.length === 0) {
      toast.error('No transcript available to export')
      setShowExportDropdown(false)
      return
    }
    // Generate VTT from segments
    let vttContent = 'WEBVTT\n\n'
    transcriptSegments.forEach((segment, index) => {
      const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        const millis = Math.round((secs - Math.floor(secs)) * 1000)
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`
      }
      vttContent += `${index + 1}\n`
      vttContent += `${formatTime(segment.start)} --> ${formatTime(segment.end)}\n`
      vttContent += `${segment.text}\n\n`
    })
    const filename = `transcript_${selectedRecording?.name.replace(/\.[^/.]+$/, '') || 'recording'}.vtt`
    setExportFormat('vtt')
    try {
      await downloadFile(vttContent, filename)
      toast.success('Exported VTT')
    } catch (error) {
      toast.error(`Export failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setShowExportDropdown(false)
    }
  }

  const handleExportJSON = async () => {
    if (!transcript) {
      toast.error('No transcript available to export')
      setShowExportDropdown(false)
      return
    }
    const jsonContent = JSON.stringify({
      transcript,
      segments: transcriptSegments,
      metadata: {
        recording: selectedRecording?.name,
        exportedAt: new Date().toISOString(),
        wordCount
      }
    }, null, 2)
    const filename = `transcript_${selectedRecording?.name.replace(/\.[^/.]+$/, '') || 'recording'}.json`
    setExportFormat('json')
    try {
      await downloadFile(jsonContent, filename)
      toast.success('Exported JSON')
    } catch (error) {
      toast.error(`Export failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setShowExportDropdown(false)
    }
  }



  return (
    <div className="flex flex-col h-full">
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
            {!leftSidebarCollapsed && (
              <PlayerSidebar
                ref={playerSidebarRef}
                recording={selectedRecording}
                currentTime={currentTime}
                onTimeUpdate={setCurrentTime}
              />
            )}

            {/* Main column – Transcript */}
            <main className="flex-1 flex flex-col bg-slate-deep overflow-hidden border-r border-slate-border">
               {/* Header area with search and buttons */}
               <div className="h-16 px-6 border-b border-slate-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
                      className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
                      title={leftSidebarCollapsed ? 'Expand left sidebar' : 'Collapse left sidebar'}
                    >
                      <span className="material-symbols-outlined">
                        {leftSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
                      </span>
                    </button>
                    <button
                      onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                      className="p-2 text-slate-400 hover:text-slate-200 transition-colors"
                      title={rightSidebarCollapsed ? 'Expand right sidebar' : 'Collapse right sidebar'}
                    >
                      <span className="material-symbols-outlined">
                        {rightSidebarCollapsed ? 'chevron_left' : 'chevron_right'}
                      </span>
                    </button>
                    <SearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Search transcript…"
                    />
                  </div>
                 <div className="flex items-center gap-3">
                   <button 
                     onClick={() => setShowModal(true)}
                     className="px-4 py-2 border border-slate-border text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-surface transition-colors"
                   >
                     <span className="material-symbols-outlined align-middle mr-2">edit</span>
                     Edit
                   </button>
                   
                   {/* Export dropdown */}
                   <div className="relative">
                     <button
                       onClick={() => setShowExportDropdown(!showExportDropdown)}
                       className="px-4 py-2 bg-indigo-primary text-slate-100 text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors flex items-center"
                     >
                        <span className="material-symbols-outlined align-middle mr-2">download</span>
                        Export · {exportFormat.toUpperCase()}
                        <span className="material-symbols-outlined align-middle ml-1 text-sm">
                         {showExportDropdown ? 'expand_less' : 'expand_more'}
                       </span>
                     </button>
                     {showExportDropdown && (
                       <div className="absolute right-0 top-full mt-1 w-48 bg-slate-900 border border-slate-border rounded-lg shadow-lg z-10">
                          <button
                            onClick={handleExportTXT}
                            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-base">description</span>
                            <span className="flex-1">Export as TXT</span>
                            {exportFormat === 'txt' && <span className="material-symbols-outlined text-base">check</span>}
                          </button>
                          <button
                            onClick={handleExportSRT}
                            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-base">subtitles</span>
                            <span className="flex-1">Export as SRT</span>
                            {exportFormat === 'srt' && <span className="material-symbols-outlined text-base">check</span>}
                          </button>
                          <button
                            onClick={handleExportVTT}
                            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-base">closed_caption</span>
                            <span className="flex-1">Export as VTT</span>
                            {exportFormat === 'vtt' && <span className="material-symbols-outlined text-base">check</span>}
                          </button>
                          <button
                            onClick={handleExportJSON}
                            className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2"
                          >
                            <span className="material-symbols-outlined text-base">data_object</span>
                            <span className="flex-1">Export as JSON</span>
                            {exportFormat === 'json' && <span className="material-symbols-outlined text-base">check</span>}
                          </button>
                       </div>
                     )}
                   </div>
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
            {!rightSidebarCollapsed && (
              <InsightsSidebar
                summary={summary}
                loadingSummary={loadingSummary}
                topics={topics}
                actions={actions}
                onActionsChange={(next) => {
                  setActions(next)
                  if (!selectedRecording) return

                  void (async () => {
                    try {
                      await persistActionCompletion(selectedRecording.path, next)
                    } catch (error) {
                      toast.error(`Failed to save actions: ${error instanceof Error ? error.message : String(error)}`)
                    }
                  })()
                }}
              />
            )}
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
      {showModal && transcript && selectedRecording && (
        <TranscriptionModal
          transcript={{
            text: transcript,
            words: [], // We don't have word-level timestamps
            duration: selectedRecording.duration || 0,
            language: 'en'
          }}
          audioPath={selectedRecording.path}
          onSaveTranscript={(updatedTranscript) => {
            setTranscript(updatedTranscript.text);
            // Re-segment
            const mockTranscript = {
              text: updatedTranscript.text,
              words: [],
              duration: selectedRecording.duration || 120,
              language: 'en'
            };
            const segments = transcriptToSegments(mockTranscript);
            setTranscriptSegments(segments);
            // Update topics, actions, and summary with unified insights
            void (async () => {
              // Clear summary while we regenerate
              setSummary(null)
              
              try {
                const insights = await getTranscriptInsights(updatedTranscript.text)
                
                if (insights.topics) {
                  setTopics(normalizeTopics(insights.topics))
                }
                if (insights.summary) {
                  setSummary(insights.summary)
                }
                if (insights.actions) {
                  const normalized: Action[] = insights.actions.map((action) => ({
                    id: actionIdFromContent(action.title, action.description),
                    title: action.title,
                    description: action.description,
                    completed: false,
                  }))
                  const merged = await mergeActionsWithSavedCompletion(selectedRecording.path, normalized)
                  setActions(merged)
                }
                // If any field missing, fall through to separate generation
                if (insights.topics && insights.summary && insights.actions) {
                  // All fields present, we're done
                  return
                }
              } catch (error) {
                console.warn('Could not generate unified insights:', error)
                // Fall back to separate AI calls
              }
              
              // Fallback: separate generation for missing fields
              try {
                const aiTopics = await extractKeyTopicsAI(updatedTranscript.text)
                setTopics(normalizeTopics(aiTopics))
              } catch {
                const extracted = extractKeyTopics(updatedTranscript.text)
                setTopics(normalizeTopics(extracted))
              }
              try {
                const aiActions = await recommendActions(updatedTranscript.text)
                const normalized: Action[] = aiActions.map((action) => ({
                  id: actionIdFromContent(action.title, action.description),
                  title: action.title,
                  description: action.description,
                  completed: false,
                }))
                const merged = await mergeActionsWithSavedCompletion(selectedRecording.path, normalized)
                setActions(merged)
              } catch {
                const fallback = extractRecommendedActions(updatedTranscript.text)
                const normalized: Action[] = fallback.map((action) => ({
                  id: actionIdFromContent(action.title, action.description),
                  title: action.title,
                  description: action.description,
                  completed: Boolean(action.completed),
                }))
                const merged = await mergeActionsWithSavedCompletion(selectedRecording.path, normalized)
                setActions(merged)
              }
              // Summary will remain null (already cleared) or could be generated via summarizeTranscript
              // but we'll leave it null for now since user edited transcript
            })()

          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
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
