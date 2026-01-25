'use client';

import { AudioItem } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { WaveformPlaceholder } from './WaveformPlaceholder';

interface RecordingsTableProps {
  recordings: AudioItem[];
  onSelect?: (id: string) => void;
}

export function RecordingsTable({ recordings, onSelect }: RecordingsTableProps) {
  if (recordings.length === 0) {
    return (
      <div className="bg-slate-900/50 rounded-lg border border-slate-border p-8 flex items-center justify-center">
        <p className="text-slate-400 text-sm">No recordings found. Sync a folder to get started.</p>
      </div>
    );
  }

  return (
    <div className="text-slate-400">
      <p>RecordingsTable component will be implemented in Task 3.</p>
      <p>Total recordings: {recordings.length}</p>
      <ul>
        {recordings.slice(0, 3).map(recording => (
          <li key={recording.id}>{recording.name}</li>
        ))}
      </ul>
    </div>
  );
}