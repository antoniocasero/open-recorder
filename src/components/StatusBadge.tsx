'use client';

interface StatusBadgeProps {
  status: 'transcribed' | 'audio_only' | 'favorited' | 'transcribing';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    transcribed: {
      label: 'Transcribed',
      bgClass: 'bg-emerald-500/20',
      textClass: 'text-emerald-300',
    },
    audio_only: {
      label: 'Audio Only',
      bgClass: 'bg-slate-700/50',
      textClass: 'text-slate-300',
    },
    favorited: {
      label: 'Favorited',
      bgClass: 'bg-indigo-500/20',
      textClass: 'text-indigo-300',
    },
    transcribing: {
      label: 'Transcribing…',
      bgClass: 'bg-amber-500/20',
      textClass: 'text-amber-300',
    },
  };

  const { label, bgClass, textClass } = config[status];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase ${bgClass} ${textClass}`}
    >
      {label}
    </span>
  );
}