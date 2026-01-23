'use client'

import { FileText, Download } from 'lucide-react'

export function Transcription() {
  return (
    <div className="bg-[#252525] rounded-lg border border-[#333] shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold">Transcription</h3>
        </div>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-[#2a2a2a] rounded-md border border-[#333] text-gray-500 cursor-not-allowed opacity-50"
        >
          <Download className="w-4 h-4" />
          <span className="text-sm">Export</span>
        </button>
      </div>

      {/* Body - Scrollable */}
      <div className="px-6 py-8 min-h-[200px] max-h-[400px] overflow-y-auto">
        <p className="text-gray-400 text-sm leading-relaxed">No transcription available yet</p>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-[#333] flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-6">
          <span>Language: —</span>
          <span>— words</span>
        </div>
      </div>
    </div>
  )
}
