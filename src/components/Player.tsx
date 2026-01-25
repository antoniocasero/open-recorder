'use client'

import { useEffect, useRef, useState } from 'react'

import { AudioItem } from '@/lib/types'
import { convertFileSrc } from '@tauri-apps/api/core'

interface PlayerProps {
  recording?: AudioItem
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  
  if (isToday) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function Player({ recording }: PlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Stop and reset when recording changes
  useEffect(() => {
    if (audioRef.current && recording) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      setError(null)
      // Force reload when source changes
      const audioSrc = convertFileSrc(recording.path)
      audioRef.current.src = audioSrc
      audioRef.current.load()
    }
  }, [recording?.id, recording?.path])

  // Debug logging
  useEffect(() => {
    if (recording) {
      const audioSrc = convertFileSrc(recording.path)
      console.log('Audio file path:', recording.path)
      console.log('Converted audio src:', audioSrc)
    }
  }, [recording?.path])

  // Update duration when metadata loads
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      setError(null)
    }
  }

  // Update current time during playback
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  // Handle audio errors
  const handleError = () => {
    if (audioRef.current) {
      const error = audioRef.current.error
      if (error) {
        let errorMessage = 'Failed to load audio'
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio loading aborted'
            break
          case error.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading audio'
            break
          case error.MEDIA_ERR_DECODE:
            errorMessage = 'Audio decoding error'
            break
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported'
            break
        }
        setError(errorMessage)
        setIsPlaying(false)
      }
    }
  }

  // Handle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        // Wait for audio to be ready
        if (audioRef.current.readyState < 2) {
          // If not ready, wait for canplay event
          await new Promise<void>((resolve, reject) => {
            const audio = audioRef.current
            if (!audio) {
              reject(new Error('Audio element not available'))
              return
            }

            const handleCanPlay = () => {
              audio.removeEventListener('canplay', handleCanPlay)
              audio.removeEventListener('error', handleLoadError)
              resolve()
            }

            const handleLoadError = () => {
              audio.removeEventListener('canplay', handleCanPlay)
              audio.removeEventListener('error', handleLoadError)
              reject(new Error('Audio failed to load'))
            }

            if (audio.readyState >= 2) {
              resolve()
            } else {
              audio.addEventListener('canplay', handleCanPlay)
              audio.addEventListener('error', handleLoadError)
              audio.load() // Trigger load if not already loading
            }
          })
        }

        await audioRef.current.play()
        setIsPlaying(true)
        setError(null)
      } catch (err) {
        console.error('Playback error:', err)
        setError(err instanceof Error ? err.message : 'Failed to play audio')
        setIsPlaying(false)
      }
    }
  }

  // Handle skip forward/backward
  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = audioRef.current.currentTime + seconds;
    const maxTime = audioRef.current.duration || duration;
    audioRef.current.currentTime = Math.max(0, Math.min(newTime, maxTime));
  };

  // Handle playback end
  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (audioRef.current) {
      audioRef.current.currentTime = 0
    }
  }

  if (!recording) {
    return (
      <div className="bg-[#252525] rounded-lg border border-[#333] p-6 flex items-center justify-center h-[400px]">
        <p className="text-gray-400 text-sm">Select a recording to play</p>
      </div>
    )
  }

  const audioSrc = recording ? convertFileSrc(recording.path) : ''
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-[#252525] rounded-lg border border-[#333] p-6">
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
      />

      <div className="mb-6">
        <h2 className="text-xl font-semibold">{recording.name}</h2>
        <p className="text-sm text-gray-400 mt-1">{formatDate(recording.mtime)}</p>
        {error && (
          <p className="text-sm text-red-400 mt-2">Error: {error}</p>
        )}
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Play/Pause Button */}
        <div className="flex items-center justify-center gap-4">
          {/* Replay 10s */}
          <button
            onClick={() => handleSkip(-10)}
            className="text-slate-400 hover:text-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">replay_10</span>
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="size-12 rounded-full bg-indigo-primary text-white hover:scale-105 transition-transform flex items-center justify-center"
          >
            {isPlaying ? (
              <span className="material-symbols-outlined">pause</span>
            ) : (
              <span className="material-symbols-outlined">play_arrow</span>
            )}
          </button>

          {/* Forward 10s */}
          <button
            onClick={() => handleSkip(10)}
            className="text-slate-400 hover:text-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">forward_10</span>
          </button>
        </div>

        {/* Waveform */}
        <div className="w-full flex items-center justify-center gap-0.5 h-24">
          {Array.from({ length: 80 }).map((_, i) => {
            const height = Math.random() * 60 + 20
            const isPlayed = (i / 80) * 100 < progress
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-colors ${
                  isPlayed ? 'bg-orange-500' : 'bg-gray-600'
                }`}
                style={{ height: `${height}%` }}
              />
            )
          })}
        </div>

        {/* Time */}
        <div className="w-full flex justify-between text-sm text-gray-400">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration || recording.duration)}</span>
        </div>
      </div>
    </div>
  )
}
