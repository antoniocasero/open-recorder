import { invoke, isTauri } from '@tauri-apps/api/core'
import { save } from '@tauri-apps/plugin-dialog'
import { Transcript, WordTimestamp } from './types'

/**
 * Formats seconds to SRT timecode: HH:MM:SS,mmm
 */
function formatTimeSRT(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const millis = Math.round((secs - Math.floor(secs)) * 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`
}

/**
 * Formats seconds to VTT timecode: HH:MM:SS.mmm
 */
function formatTimeVTT(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  const millis = Math.round((secs - Math.floor(secs)) * 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${Math.floor(secs).toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`
}

/**
 * Segments words into chunks of up to 5 words or 3 seconds duration.
 * Returns array of segments with start, end, and text.
 */
function segmentWords(words: WordTimestamp[], maxWords = 5, maxDuration = 3): Array<{start: number, end: number, text: string}> {
  if (words.length === 0) return []
  
  const segments: Array<{start: number, end: number, text: string}> = []
  let segmentStart = words[0].start
  let segmentWords: WordTimestamp[] = []
  
  for (const word of words) {
    // If adding this word would exceed maxWords or maxDuration, finalize current segment
    if (segmentWords.length >= maxWords || (word.end - segmentStart) > maxDuration) {
      if (segmentWords.length > 0) {
        const lastWord = segmentWords[segmentWords.length - 1]
        segments.push({
          start: segmentStart,
          end: lastWord.end,
          text: segmentWords.map(w => w.word).join(' ')
        })
      }
      // Start new segment with current word
      segmentStart = word.start
      segmentWords = [word]
    } else {
      segmentWords.push(word)
    }
  }
  
  // Add final segment
  if (segmentWords.length > 0) {
    const lastWord = segmentWords[segmentWords.length - 1]
    segments.push({
      start: segmentStart,
      end: lastWord.end,
      text: segmentWords.map(w => w.word).join(' ')
    })
  }
  
  return segments
}

/**
 * Converts transcript to SRT subtitle format.
 */
export function toSRT(transcript: Transcript): string {
  const segments = segmentWords(transcript.words)
  return segments.map((seg, idx) => {
    return `${idx + 1}\n${formatTimeSRT(seg.start)} --> ${formatTimeSRT(seg.end)}\n${seg.text}\n`
  }).join('\n')
}

/**
 * Converts transcript to WebVTT subtitle format.
 */
export function toVTT(transcript: Transcript): string {
  const segments = segmentWords(transcript.words)
  const header = 'WEBVTT\n\n'
  return header + segments.map((seg, idx) => {
    return `${idx + 1}\n${formatTimeVTT(seg.start)} --> ${formatTimeVTT(seg.end)}\n${seg.text}\n`
  }).join('\n')
}

/**
 * Converts transcript to JSON format with metadata.
 */
export function toJSON(transcript: Transcript): string {
  const enriched = {
    ...transcript,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }
  return JSON.stringify(enriched, null, 2)
}

/**
 * Downloads a string as a file in the browser.
 */
function getFileExtension(filename: string): string | null {
  const parts = filename.split('.')
  if (parts.length < 2) return null
  return parts[parts.length - 1]?.toLowerCase() || null
}

function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && isTauri()
}

export async function downloadFile(content: string, filename: string) {
  if (isTauriEnvironment()) {
    const extension = getFileExtension(filename)
    const filters = extension
      ? [{ name: extension.toUpperCase(), extensions: [extension] }]
      : undefined
    const path = await save({
      defaultPath: filename,
      filters
    })
    if (!path) return
    await invoke('save_export', { path, content })
    return
  }

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
