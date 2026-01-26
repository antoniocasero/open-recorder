import { invoke } from '@tauri-apps/api/core'
import { Transcript } from './types'

/**
 * Transcribes an audio file using OpenAI Whisper API.
 * @param filePath Path to the audio file
 * @returns Transcript with text, word timestamps, duration, and language
 * @throws Error if transcription fails (missing API key, network error, etc.)
 */
export async function transcribeAudio(filePath: string): Promise<Transcript> {
  return invoke<Transcript>('transcribe_audio', { path: filePath })
}

export async function transcribeAudioBatch(filePaths: string[]): Promise<Array<Transcript | string>> {
  return invoke<Array<Transcript | string>>('transcribe_audio_batch', { paths: filePaths })
}

/**
 * Checks if a transcript file already exists for the given audio file.
 * @param audioPath Path to the audio file
 * @returns Path to the transcript .txt file if it exists, null otherwise
 */
export async function getTranscriptPath(audioPath: string): Promise<string | null> {
  // Simple heuristic: replace extension with .txt
  const transcriptPath = audioPath.replace(/\.[^/.]+$/, '.txt')
  // TODO: actually check if file exists (requires additional Tauri command)
  // For now, return the expected path
  return transcriptPath
}

/**
 * Saves edited transcript text back to sidecar .txt file.
 * @param audioPath Path to the original audio file
 * @param text The edited transcript text
 * @throws Error if file write fails
 */
export async function saveTranscript(audioPath: string, text: string): Promise<void> {
  return invoke('save_transcript', { path: audioPath, text })
}

/**
 * Reads transcript text from sidecar .txt file.
 * @param audioPath Path to the audio file
 * @returns Transcript text if file exists, null if file not found or error
 */
export async function readTranscript(audioPath: string): Promise<string | null> {
  try {
    return await invoke<string>('read_transcript', { path: audioPath })
  } catch (error) {
    // File not found or other error
    console.warn(`Failed to read transcript for ${audioPath}:`, error)
    return null
  }
}

/**
 * Generates AI summary of transcript text using OpenAI chat models.
 * @param text Transcript text to summarize
 * @returns Summary string (bullet points)
 * @throws Error if API key missing, network error, or empty text
 */
export async function summarizeTranscript(text: string): Promise<string> {
  return invoke<string>('summarize_transcript', { text })
}

export interface RecommendedAction {
  title: string
  description: string
}

export async function recommendActions(text: string): Promise<RecommendedAction[]> {
  return invoke<RecommendedAction[]>('recommend_actions', { text })
}

export async function extractKeyTopicsAI(text: string): Promise<string[]> {
  return invoke<string[]>('extract_key_topics', { text })
}

export interface TranscriptInsights {
  summary?: string
  actions?: RecommendedAction[]
  topics?: string[]
}

export async function getTranscriptInsights(text: string): Promise<TranscriptInsights> {
  return invoke<TranscriptInsights>('get_transcript_insights', { text })
}
