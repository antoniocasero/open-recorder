'use client';

import { useState, useEffect } from 'react';

interface WaveformPlaceholderProps {
  transcribed: boolean;
}

export function WaveformPlaceholder({ transcribed }: WaveformPlaceholderProps) {
  const [heights, setHeights] = useState<number[]>([]);

  useEffect(() => {
    // Generate 8 random heights between 20% and 100%
    const newHeights = Array.from({ length: 8 }, () => Math.random() * 0.8 + 0.2);
    setHeights(newHeights);
  }, []);

  if (heights.length === 0) {
    return <div className="w-24 h-6 flex items-end gap-0.5" />;
  }

  const barColor = transcribed ? 'bg-indigo-primary/40' : 'bg-slate-700';

  return (
    <div className="w-24 h-6 flex items-end gap-0.5">
      {heights.map((height, index) => (
        <div
          key={index}
          className={`w-2 rounded-sm ${barColor}`}
          style={{ height: `${height * 100}%` }}
        />
      ))}
    </div>
  );
}