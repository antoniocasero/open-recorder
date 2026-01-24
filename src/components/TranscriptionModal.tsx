'use client'

import { X, Copy, Download, Edit, Save, XCircle } from 'lucide-react'
import { Transcript } from '@/lib/transcription/types'
import { useState } from 'react'

interface TranscriptionModalProps {
  transcript: Transcript
  audioPath?: string
  onClose: () => void
}

export function TranscriptionModal({ transcript, audioPath, onClose }: TranscriptionModalProps) {
  const [copied, setCopied] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedText, setEditedText] = useState('')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([transcript.text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleEdit = () => {
    setEditMode(true)
    setEditedText(transcript.text)
  }

  const handleCancel = () => {
    setEditMode(false)
    setEditedText('')
  }

  const handleSave = () => {
    // TODO: implement save functionality in Task 3
    console.log('Save edited text:', editedText)
    setEditMode(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#252525] rounded-lg border border-[#333] w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
           <div>
             <h3 className="text-lg font-semibold">Transcript{editMode ? ' (Editing)' : ''}</h3>
             <p className="text-sm text-gray-400">
               {transcript.language} · {transcript.words.length} words · {transcript.duration.toFixed(1)}s
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
               className="w-full h-48 p-2 bg-[#2a2a2a] border border-[#444] rounded text-sm text-gray-300 whitespace-pre-wrap font-mono"
               value={editedText}
               onChange={(e) => setEditedText(e.target.value)}
               autoFocus
             />
           ) : (
             <>
               {/* Word‑by‑word display with timestamps */}
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

               {/* Plain text block */}
               <div className="mt-6 pt-4 border-t border-[#333]">
                 <p className="text-sm text-gray-300 whitespace-pre-wrap">{transcript.text}</p>
               </div>
             </>
           )}
         </div>

         {/* Footer */}
         <div className="p-4 border-t border-[#333] flex items-center justify-between">
           <div className="text-xs text-gray-500">
             Click a word to seek in audio (future feature)
           </div>
           <div className="flex items-center gap-2">
             {editMode ? (
               <>
                 <button
                   onClick={handleCancel}
                   className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded border border-[#333] hover:bg-[#333] transition-colors"
                 >
                   <XCircle className="w-4 h-4" />
                   <span className="text-sm">Cancel</span>
                 </button>
                 <button
                   onClick={handleSave}
                   className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded border border-blue-700 hover:bg-blue-700 transition-colors"
                 >
                   <Save className="w-4 h-4" />
                   <span className="text-sm">Save</span>
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