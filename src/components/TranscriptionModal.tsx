'use client'

import { X, Copy, Download, Edit, Save, XCircle, Loader, FileText, FileCode, Code, Sparkles, RefreshCw } from 'lucide-react'
import { Transcript } from '@/lib/transcription/types'
import { useState } from 'react'
import { saveTranscript, summarizeTranscript } from '@/lib/transcription/commands'
import { toSRT, toVTT, toJSON, downloadFile } from '@/lib/transcription/export'
import toast from 'react-hot-toast'

interface TranscriptionModalProps {
  transcript: Transcript
  audioPath?: string
  onSaveTranscript?: (transcript: Transcript) => void
  onClose: () => void
}

export function TranscriptionModal({ transcript, audioPath, onSaveTranscript, onClose }: TranscriptionModalProps) {
  const [copied, setCopied] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const wordCount = transcript.words.length > 0
    ? transcript.words.length
    : transcript.text.split(/\s+/).filter(Boolean).length
  const durationLabel = transcript.duration > 0 ? `${transcript.duration.toFixed(1)}s` : '--'
  const hasWordTimestamps = transcript.words.length > 0

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async () => {
    try {
      await downloadFile(transcript.text, `transcript_${new Date().toISOString().slice(0, 10)}.txt`)
    } catch (error) {
      console.error('Failed to download transcript:', error)
      toast.error(`Failed to download: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleExportSRT = async () => {
    try {
      const content = toSRT(transcript)
      await downloadFile(content, `transcript_${Date.now()}.srt`)
    } catch (error) {
      console.error('Failed to export SRT:', error)
      toast.error(`Failed to export SRT: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleExportVTT = async () => {
    try {
      const content = toVTT(transcript)
      await downloadFile(content, `transcript_${Date.now()}.vtt`)
    } catch (error) {
      console.error('Failed to export VTT:', error)
      toast.error(`Failed to export VTT: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleExportJSON = async () => {
    try {
      const content = toJSON(transcript)
      await downloadFile(content, `transcript_${Date.now()}.json`)
    } catch (error) {
      console.error('Failed to export JSON:', error)
      toast.error(`Failed to export JSON: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleEdit = () => {
    setEditMode(true)
    setEditedText(transcript.text)
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditedText('')
  }

  const handleSave = async () => {
    if (!audioPath) {
      toast.error('Cannot save: missing audio file path')
      return
    }
    setSaving(true)
    try {
      await saveTranscript(audioPath, editedText)
      
      // Create updated transcript object
      const updatedTranscript: Transcript = {
        ...transcript,
        text: editedText
      }
      
      // Notify parent if callback provided
      if (onSaveTranscript) {
        onSaveTranscript(updatedTranscript)
      }
      
      setEditMode(false)
      toast.success('Transcript saved successfully')
    } catch (error) {
      console.error('Failed to save transcript:', error)
      toast.error(`Failed to save transcript: ${error instanceof Error ? error.message : String(error)}`)
      // Stay in edit mode
    } finally {
      setSaving(false)
    }
  }

  const handleSummarize = async () => {
    setLoadingSummary(true)
    try {
      const result = await summarizeTranscript(transcript.text)
      setSummary(result)
      toast.success('Summary generated')
    } catch (error) {
      console.error('Failed to generate summary:', error)
      toast.error(`Failed to generate summary: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoadingSummary(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#252525] rounded-lg border border-[#333] w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
           <div>
             <h3 className="text-lg font-semibold">Transcript{editMode ? ' (Editing)' : ''}</h3>
             <p className="text-sm text-gray-400">
               {transcript.language} · {wordCount} words · {durationLabel}
             </p>
           </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#333] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

         {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {editMode ? (
              <textarea
                className="w-full min-h-[320px] p-3 bg-[#2a2a2a] border border-[#444] rounded text-sm text-gray-300 whitespace-pre-wrap font-mono"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                autoFocus
              />
            ) : (
              <>
                {/* Word‑by‑word display with timestamps */}
                {hasWordTimestamps && (
                  <div className="space-y-2">
                    {transcript.words.map((word, idx) => (
                      <div
                        key={idx}
                        className="inline-flex items-center bg-[#2a2a2a] rounded px-2 py-1 mr-2 mb-2 border border-[#333]"
                        title={`${word.start.toFixed(2)}s – ${word.end.toFixed(2)}s`}
                      >
                        <span className="text-sm">{word.word}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          {word.start.toFixed(1)}s
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Plain text block */}
                <div className={hasWordTimestamps ? 'mt-6 pt-4 border-t border-[#333]' : ''}>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{transcript.text}</p>
                 </div>

                {summary && (
                  <div className="mt-6 pt-4 border-t border-[#333]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-300">AI Summary</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSummarize}
                          disabled={loadingSummary}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50"
                          title="Regenerate summary"
                        >
                          <RefreshCw className={`w-3 h-3 ${loadingSummary ? 'animate-spin' : ''}`} />
                          Regenerate
                        </button>
                        <button
                          onClick={() => setSummary('')}
                          className="text-xs text-gray-500 hover:text-gray-300"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="bg-[#2a2a2a] rounded border border-[#333] p-3 max-h-48 overflow-y-auto">
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">{summary}</p>
                    </div>
                  </div>
                )}
              </>
           )}
         </div>

         {/* Footer */}
          <div className="p-4 border-t border-[#333] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-gray-500">
              {hasWordTimestamps ? 'Click a word to seek in audio (future feature)' : 'Edit or export this transcript'}
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
             {editMode ? (
               <>
                 <button
                   onClick={handleCancel}
                   disabled={saving}
                   className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded border border-[#333] hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   <XCircle className="w-4 h-4" />
                   <span className="text-sm">Cancel</span>
                 </button>
                 <button
                   onClick={handleSave}
                   disabled={saving}
                   className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded border border-blue-700 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {saving ? (
                     <Loader className="w-4 h-4 animate-spin" />
                   ) : (
                     <Save className="w-4 h-4" />
                   )}
                   <span className="text-sm">{saving ? 'Saving...' : 'Save'}</span>
                 </button>
               </>
             ) : (
               <>
                 <button
                   onClick={handleCopy}
                   className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded border border-[#333] hover:bg-[#333] transition-colors"
                 >
                   <Copy className="w-4 h-4" />
                   <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                 </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded border border-[#333] hover:bg-[#333] transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Download .txt</span>
                  </button>
                  <button
                    onClick={handleExportSRT}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded border border-[#333] hover:bg-[#333] transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Export SRT</span>
                  </button>
                  <button
                    onClick={handleExportVTT}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded border border-[#333] hover:bg-[#333] transition-colors"
                  >
                    <FileCode className="w-4 h-4" />
                    <span className="text-sm">Export VTT</span>
                  </button>
                   <button
                     onClick={handleExportJSON}
                     className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded border border-[#333] hover:bg-[#333] transition-colors"
                   >
                     <Code className="w-4 h-4" />
                     <span className="text-sm">Export JSON</span>
                   </button>
                   <button
                     onClick={handleSummarize}
                     disabled={loadingSummary}
                     className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 rounded border border-purple-700 hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {loadingSummary ? (
                       <Loader className="w-4 h-4 animate-spin" />
                     ) : (
                       <Sparkles className="w-4 h-4" />
                     )}
                     <span className="text-sm">{loadingSummary ? 'Summarizing...' : 'Summarize'}</span>
                   </button>
                   <button
                     onClick={handleEdit}
                     className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded border border-[#333] hover:bg-[#333] transition-colors"
                   >
                     <Edit className="w-4 h-4" />
                     <span className="text-sm">Edit</span>
                   </button>
               </>
             )}
           </div>
         </div>
      </div>
    </div>
  )
}
