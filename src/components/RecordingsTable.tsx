'use client';

import { useState, useEffect, useRef, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AudioItem } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { WaveformPlaceholder } from './WaveformPlaceholder';
import { readTranscript, transcribeAudio } from '@/lib/transcription/commands';
import { Transcript } from '@/lib/transcription/types';
import { setTranscriptionMeta } from '@/lib/fs/config';
import { TranscriptionModal } from './TranscriptionModal';

interface RecordingsTableProps {
  recordings: AudioItem[];
  onSelect?: (id: string) => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function RecordingsTable({ recordings, onSelect }: RecordingsTableProps) {
  const router = useRouter();
  const [transcriptStatus, setTranscriptStatus] = useState<Record<string, boolean>>({});
  const transcriptCache = useRef<Map<string, boolean>>(new Map());
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [activeTranscript, setActiveTranscript] = useState<Transcript | null>(null);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [activeAudioPath, setActiveAudioPath] = useState<string | null>(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);

  useEffect(() => {
    // Check transcript existence for each recording
    const checkTranscripts = async () => {
      const newStatus: Record<string, boolean> = {};
      const promises = recordings.map(async (recording) => {
        // Check cache first
        if (transcriptCache.current.has(recording.path)) {
          newStatus[recording.id] = transcriptCache.current.get(recording.path)!;
          return;
        }
        // Fetch transcript existence
        const transcript = await readTranscript(recording.path);
        const hasTranscript = transcript !== null;
        transcriptCache.current.set(recording.path, hasTranscript);
        newStatus[recording.id] = hasTranscript;
      });
      await Promise.all(promises);
      setTranscriptStatus(newStatus);
    };

    if (recordings.length > 0) {
      checkTranscripts();
    }
  }, [recordings]);

  const handleRowClick = (id: string) => {
    router.push(`/editor?recording=${id}`);
    if (onSelect) {
      onSelect(id);
    }
  };

  const handleActionClick = async (event: MouseEvent<HTMLButtonElement>, recording: AudioItem) => {
    event.stopPropagation();
    if (actionLoading[recording.id]) return;

    setActionLoading((prev) => ({
      ...prev,
      [recording.id]: true,
    }));
    setActiveRecordingId(recording.id);
    setActiveAudioPath(recording.path);

    try {
      const existingTranscript = await readTranscript(recording.path);
      if (existingTranscript) {
        try {
          await setTranscriptionMeta(recording.path, {
            language: 'unknown',
            transcribedAt: Date.now(),
            transcriptionSeconds: recording.duration ?? 0,
            audioSeconds: recording.duration,
          });
        } catch (error) {
          console.warn('Failed to persist transcription metadata:', error);
        }

        const transcript: Transcript = {
          text: existingTranscript,
          words: [],
          duration: recording.duration ?? 0,
          language: 'Unknown',
        };
        setActiveTranscript(transcript);
        setShowTranscriptModal(true);
        setTranscriptStatus((prev) => ({
          ...prev,
          [recording.id]: true,
        }));
        return;
      }

      const transcript = await transcribeAudio(recording.path);

      try {
        await setTranscriptionMeta(recording.path, {
          language: transcript.language?.trim() || 'unknown',
          transcribedAt: Date.now(),
          transcriptionSeconds: transcript.duration,
          audioSeconds: recording.duration,
        });
      } catch (error) {
        console.warn('Failed to persist transcription metadata:', error);
      }

      setActiveTranscript(transcript);
      setShowTranscriptModal(true);
      setTranscriptStatus((prev) => ({
        ...prev,
        [recording.id]: true,
      }));
    } catch (error) {
      console.error('Failed to open transcript:', error);
    } finally {
      setActionLoading((prev) => ({
        ...prev,
        [recording.id]: false,
      }));
    }
  };

  const handleTranscriptSaved = (transcript: Transcript) => {
    setActiveTranscript(transcript);
    if (activeRecordingId) {
      setTranscriptStatus((prev) => ({
        ...prev,
        [activeRecordingId]: true,
      }));
    }
  };

  if (recordings.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-lg border border-slate-border p-8 flex items-center justify-center">
        <p className="text-slate-400 text-sm">No recordings found. Sync a folder to get started.</p>
      </div>
    );
  }

  const columns = [
    { key: 'waveform', label: 'WAVEFORM' },
    { key: 'title', label: 'TITLE' },
    { key: 'date', label: 'DATE' },
    { key: 'duration', label: 'DURATION' },
    { key: 'status', label: 'STATUS' },
    { key: 'actions', label: 'ACTIONS' },
  ];

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-slate-border">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="border-b border-slate-border bg-slate-deep p-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recordings.map((recording) => {
              const hasTranscript = transcriptStatus[recording.id] || false;
              const status = hasTranscript ? 'transcribed' : 'audio_only';
              const isLoading = actionLoading[recording.id] || false;

              return (
                <tr
                  key={recording.id}
                  onClick={() => handleRowClick(recording.id)}
                  className="table-row-hover border-b border-slate-border/30"
                >
                  {/* Waveform column */}
                  <td className="p-3">
                    <WaveformPlaceholder transcribed={hasTranscript} />
                  </td>
                  {/* Title column */}
                  <td className="p-3">
                    <p className="text-sm font-medium text-slate-200 truncate max-w-xs">
                      {recording.name}
                    </p>
                  </td>
                  {/* Date column */}
                  <td className="p-3 text-sm text-slate-400">
                    {formatDate(recording.mtime)}
                  </td>
                  {/* Duration column */}
                  <td className="p-3 text-sm text-slate-400">
                    {formatDuration(recording.duration)}
                  </td>
                  {/* Status column */}
                  <td className="p-3">
                    <StatusBadge status={status} />
                  </td>
                  {/* Actions column */}
                  <td className="p-3">
                    <button
                      className="p-1 hover:bg-slate-surface rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={(event) => handleActionClick(event, recording)}
                      disabled={isLoading}
                      aria-label={isLoading ? 'Loading transcript' : 'Open transcript'}
                    >
                      <span
                        className={`material-symbols-outlined text-slate-400 ${
                          isLoading ? 'animate-spin' : ''
                        }`}
                      >
                        {isLoading ? 'progress_activity' : 'more_horiz'}
                      </span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showTranscriptModal && activeTranscript && activeAudioPath && (
        <TranscriptionModal
          transcript={activeTranscript}
          audioPath={activeAudioPath}
          onSaveTranscript={handleTranscriptSaved}
          onClose={() => {
            setShowTranscriptModal(false);
            setActiveTranscript(null);
            setActiveRecordingId(null);
            setActiveAudioPath(null);
          }}
        />
      )}
    </>
  );
}
