export interface WordTimestamp {
  word: string
  start: number
  end: number
}

export interface Transcript {
  text: string
  words: WordTimestamp[]
  duration: number
  language: string
}

export type TranscriptionStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'error'

export interface TranscriptionState {
  status: TranscriptionStatus
  transcript?: Transcript
  error?: string
}