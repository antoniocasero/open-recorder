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