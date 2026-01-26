import { Transcript, TranscriptSegment } from './types'

/**
 * Groups words into sentences based on punctuation.
 * Returns array of sentence boundaries (indices).
 */
function findSentenceBoundaries(words: { word: string }[]): number[] {
  const boundaries: number[] = []
  const sentenceEndRegex = /[.!?]\s*$/
  
  for (let i = 0; i < words.length; i++) {
    if (sentenceEndRegex.test(words[i].word)) {
      boundaries.push(i) // inclusive end index
    }
  }
  // If no boundaries found, treat whole transcript as one sentence
  if (boundaries.length === 0) {
    boundaries.push(words.length - 1)
  }
  return boundaries
}

/**
 * Convert a Transcript with word timestamps into speaker‑segmented lines.
 * This is a naive implementation that alternates speakers for demonstration.
 * A real implementation would use speaker diarization data.
 */
export function transcriptToSegments(transcript: Transcript): TranscriptSegment[] {
  const { words, text, duration } = transcript
  const segments: TranscriptSegment[] = []

  // If we have word timestamps, group by sentences
  if (words.length > 0) {
    const boundaries = findSentenceBoundaries(words)
    let startIdx = 0
    for (let i = 0; i < boundaries.length; i++) {
      const endIdx = boundaries[i]
      const segmentWords = words.slice(startIdx, endIdx + 1)
      const start = segmentWords[0].start
      const end = segmentWords[segmentWords.length - 1].end
      const segmentText = segmentWords.map(w => w.word).join(' ')
      // Alternate speakers: even segments = Interviewer, odd = Speaker 1
      const speaker = i % 2 === 0 ? 'Interviewer' : 'Speaker 1'
      segments.push({ speaker, text: segmentText, start, end })
      startIdx = endIdx + 1
    }
  } else {
    // No word timestamps – split plain text by sentences and guess timestamps
    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text]
    const sentenceDuration = duration / Math.max(sentences.length, 1)
    sentences.forEach((sentence, idx) => {
      const start = idx * sentenceDuration
      const end = (idx + 1) * sentenceDuration
      const speaker = idx % 2 === 0 ? 'Interviewer' : 'Speaker 1'
      segments.push({ speaker, text: sentence.trim(), start, end })
    })
  }

  return segments
}

/**
 * Format seconds as MM:SS (minutes:seconds), padding with zero if needed.
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}