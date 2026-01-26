'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

import { AudioItem } from '@/lib/types'
import { convertFileSrc } from '@tauri-apps/api/core'

interface PlayerHandle {
  seek: (time: number) => void
}

interface PlayerProps {
  recording?: AudioItem
  onTimeUpdate?: (time: number) => void
}



export const Player = forwardRef<PlayerHandle, PlayerProps>(({ recording, onTimeUpdate }, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  useImperativeHandle(ref, () => ({
    seek: (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time
      }
    }
  }))
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
      const time = audioRef.current.currentTime
      setCurrentTime(time)
      onTimeUpdate?.(time)
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
      <div className="flex items-center justify-center">
        <p className="text-gray-400 text-sm">Select a recording to play</p>
      </div>
    )
  }

  const audioSrc = recording ? convertFileSrc(recording.path) : ''

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
      />

      {/* Error display */}
      {error && (
        <p className="text-sm text-red-400 mb-2">Error: {error}</p>
      )}

      {/* Play Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Replay 10s */}
        <button
          onClick={() => handleSkip(-10)}
          className="text-slate-400 hover:text-slate-100 transition-colors"
          title="Replay 10 seconds"
        >
          <span className="material-symbols-outlined text-2xl">replay_10</span>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="size-12 rounded-full bg-indigo-primary text-white hover:scale-105 transition-transform flex items-center justify-center"
          title={isPlaying ? 'Pause' : 'Play'}
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
          title="Forward 10 seconds"
        >
          <span className="material-symbols-outlined text-2xl">forward_10</span>
        </button>
      </div>
    </>
  )
});
