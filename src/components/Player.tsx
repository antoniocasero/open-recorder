'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'
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

  // Stop and reset when recording changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
    }
  }, [recording?.id])

  // Update duration when metadata loads
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  // Update current time during playback
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  // Handle play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      await audioRef.current.play()
      setIsPlaying(true)
    }
  }

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

  const audioSrc = convertFileSrc(recording.path)
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-[#252525] rounded-lg border border-[#333] p-6">
      <audio
        ref={audioRef}
        src={audioSrc}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      <div className="mb-6">
        <h2 className="text-xl font-semibold">{recording.name}</h2>
        <p className="text-sm text-gray-400 mt-1">{formatDate(recording.mtime)}</p>
      </div>

      <div className="flex flex-col items-center gap-6">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 flex items-center justify-center shadow-lg transition-all"
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 text-white" fill="white" />
          ) : (
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          )}
        </button>

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
