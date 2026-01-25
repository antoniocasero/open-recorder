'use client';

import { useState, useEffect } from 'react';
import { Footer } from '@/components/Footer';
import { SidebarFilters } from '@/components/SidebarFilters';
import { RecordingsTable } from '@/components/RecordingsTable';
import { pickFolder, scanFolderForAudio } from '@/lib/fs/commands';
import { getLastFolder, setLastFolder } from '@/lib/fs/config';
import { AudioItem } from '@/lib/types';

export default function LibraryPage() {
  const [recordings, setRecordings] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    loadLastFolder();
  }, []);

  useEffect(() => {
    // Calculate total duration whenever recordings change
    const total = recordings.reduce((sum, r) => sum + (r.duration || 0), 0);
    setTotalDuration(total);
  }, [recordings]);

  async function loadLastFolder() {
    const lastPath = await getLastFolder();
    if (lastPath) {
      await scanFolder(lastPath);
    }
  }

  async function handleChooseFolder() {
    setLoading(true);
    try {
      const folderPath = await pickFolder();
      await scanFolder(folderPath);
      await setLastFolder(folderPath);
    } catch (err) {
      console.error('Failed to pick folder:', err);
    } finally {
      setLoading(false);
    }
  }

  async function scanFolder(folderPath: string) {
    setLoading(true);
    try {
      const items = await scanFolderForAudio(folderPath);
      setRecordings(items);
    } catch (err) {
      console.error('Failed to scan folder:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left sidebar */}
      <aside className="w-64 border-r border-slate-border p-4">
        <SidebarFilters />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header area */}
        <div className="border-b border-slate-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                My Files / All Recordings
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg hover:bg-slate-surface transition-colors">
                <span className="material-symbols-outlined">grid_view</span>
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-surface transition-colors">
                <span className="material-symbols-outlined">view_list</span>
              </button>
              <button
                onClick={handleChooseFolder}
                disabled={loading}
                className="px-4 py-2 bg-indigo-primary text-slate-100 text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">sync</span>
                Sync Device
              </button>
            </div>
          </div>
        </div>

        {/* Table area */}
        <div className="flex-1 overflow-auto p-4">
          <RecordingsTable recordings={recordings} onSelect={(id) => console.log('Selected:', id)} />
        </div>

        {/* Footer */}
        <Footer>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Total Recordings: {recordings.length}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              Total Duration: {formatDuration(totalDuration)}
            </span>
          </div>
        </Footer>
      </main>
    </div>
  );
}