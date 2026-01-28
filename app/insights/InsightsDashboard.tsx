'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { Footer } from '@/components/Footer';
import { getAllTranscriptionMeta, getLastFolder } from '@/lib/fs/config';
import { getLibraryInsights } from '@/lib/insights/commands';
import { exportInsightsReport } from '@/lib/insights/export';
import { formatDayLabel, formatMinutes, formatPct } from '@/lib/insights/format';
import type { InsightsRangePreset, LibraryInsightsPayload } from '@/lib/insights/types';

import { InsightsCharts } from './InsightsCharts';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const PRESETS: Array<{ value: InsightsRangePreset; label: string }> = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All' },
];

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-border bg-slate-panel/80 p-4">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-100">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-800/60 ${className}`} />;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6">
      <div className="text-sm font-semibold text-red-200">Failed to load insights</div>
      <div className="mt-2 text-sm text-red-300/80">{message}</div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600/20 px-3 py-2 text-sm font-medium text-red-100 ring-1 ring-inset ring-red-600/30 hover:bg-red-600/30"
      >
        <span className="material-symbols-outlined text-lg">refresh</span>
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-slate-border bg-slate-panel/60 p-8">
      <div className="text-lg font-semibold text-slate-100">No library folder selected</div>
      <div className="mt-2 max-w-xl text-sm text-slate-400">
        Insights are generated from your most recently synced folder. Head to the library to pick a folder and scan your recordings.
      </div>
      <Link
        href="/library"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-primary px-4 py-2 text-sm font-medium text-slate-100 hover:bg-indigo-600"
      >
        <span className="material-symbols-outlined text-lg">folder_open</span>
        Go to Library
      </Link>
    </div>
  );
}

export function InsightsDashboard() {
  const [lastFolder, setLastFolder] = useState<string | null>(null);
  const [preset, setPreset] = useState<InsightsRangePreset>('30d');
  const [payload, setPayload] = useState<LibraryInsightsPayload | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFolder() {
      const folder = await getLastFolder();
      if (cancelled) return;
      setLastFolder(folder);
    }

    loadFolder();
    return () => {
      cancelled = true;
    };
  }, []);

  const canLoad = Boolean(lastFolder);
  const titleSuffix = useMemo(() => {
    if (!lastFolder) return null;
    const parts = lastFolder.split('/').filter(Boolean);
    return parts.at(-1) ?? lastFolder;
  }, [lastFolder]);

  async function fetchInsights() {
    if (!lastFolder) return;

    setLoadState('loading');
    setError(null);
    try {
      const meta = await getAllTranscriptionMeta();
      const next = await getLibraryInsights({
        folderPath: lastFolder,
        preset,
        transcriptionMetaByPath: meta,
      });
      setPayload(next);
      setLoadState('ready');
    } catch (err) {
      setPayload(null);
      setLoadState('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    if (!canLoad) return;
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad, preset]);

  const kpis = payload?.kpis;
  const seriesLabels = useMemo(() => {
    if (!payload) return {} as Record<number, string>;
    const next: Record<number, string> = {};
    for (const point of payload.series) {
      next[point.dayStartUnix] = formatDayLabel(point.dayStartUnix, payload.preset);
    }
    return next;
  }, [payload]);

  async function handleExport() {
    if (!payload) return;
    setExporting(true);
    try {
      await exportInsightsReport(payload);
    } catch (err) {
      console.error('Failed to export insights report:', err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="flex flex-col h-full">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="border-b border-slate-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-sm font-semibold text-slate-300">Insights</h1>
              <div className="mt-1 text-xs text-slate-500">
                Usage and transcription metrics{titleSuffix ? ` - ${titleSuffix}` : ''}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-border bg-slate-panel/60 p-1">
                {PRESETS.map((option) => {
                  const active = option.value === preset;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPreset(option.value)}
                      className={
                        active
                          ? 'rounded-md bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100'
                          : 'rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200'
                      }
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                disabled={!payload || exporting}
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-primary px-3 py-2 text-sm font-medium text-slate-100 hover:bg-indigo-600 disabled:opacity-60 disabled:hover:bg-indigo-primary"
                title={!payload ? 'Load insights to export a report' : 'Export report as JSON'}
              >
                <span className="material-symbols-outlined text-lg">{exporting ? 'sync' : 'download'}</span>
                {exporting ? 'Exporting' : 'Export report'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {!canLoad ? (
            <EmptyState />
          ) : loadState === 'error' && error ? (
            <ErrorState message={error} onRetry={fetchInsights} />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {loadState === 'loading' || !kpis ? (
                  <>
                    <div className="rounded-xl border border-slate-border bg-slate-panel/80 p-4">
                      <SkeletonBlock className="h-4 w-24" />
                      <SkeletonBlock className="mt-3 h-8 w-28" />
                      <SkeletonBlock className="mt-2 h-3 w-32" />
                    </div>
                    <div className="rounded-xl border border-slate-border bg-slate-panel/80 p-4">
                      <SkeletonBlock className="h-4 w-24" />
                      <SkeletonBlock className="mt-3 h-8 w-28" />
                      <SkeletonBlock className="mt-2 h-3 w-32" />
                    </div>
                    <div className="rounded-xl border border-slate-border bg-slate-panel/80 p-4">
                      <SkeletonBlock className="h-4 w-24" />
                      <SkeletonBlock className="mt-3 h-8 w-28" />
                      <SkeletonBlock className="mt-2 h-3 w-32" />
                    </div>
                    <div className="rounded-xl border border-slate-border bg-slate-panel/80 p-4">
                      <SkeletonBlock className="h-4 w-24" />
                      <SkeletonBlock className="mt-3 h-8 w-28" />
                      <SkeletonBlock className="mt-2 h-3 w-32" />
                    </div>
                  </>
                ) : (
                  <>
                    <KpiCard
                      label="Recordings"
                      value={kpis.totalRecordings.toLocaleString()}
                      hint={`${kpis.transcribedRecordings.toLocaleString()} transcribed`}
                    />
                    <KpiCard
                      label="Minutes recorded"
                      value={formatMinutes(kpis.totalRecordingSeconds)}
                      hint="Across selected range"
                    />
                    <KpiCard
                      label="Minutes transcribed"
                      value={formatMinutes(kpis.transcribedSeconds)}
                      hint={formatPct(kpis.transcriptionCoveragePct) + ' coverage'}
                    />
                    <KpiCard
                      label="Coverage"
                      value={formatPct(kpis.transcriptionCoveragePct)}
                      hint="Transcribed minutes / total minutes"
                    />
                  </>
                )}
              </div>

              {payload ? (
                <InsightsCharts payload={payload} seriesLabels={seriesLabels} />
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="h-72 rounded-xl border border-slate-border bg-slate-panel/60 p-4">
                    <SkeletonBlock className="h-4 w-32" />
                    <SkeletonBlock className="mt-4 h-48 w-full" />
                  </div>
                  <div className="h-56 rounded-xl border border-slate-border bg-slate-panel/60 p-4">
                    <SkeletonBlock className="h-4 w-32" />
                    <SkeletonBlock className="mt-4 h-32 w-full" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase text-slate-500">
            {canLoad ? `Range: ${preset}` : 'No folder selected'}
          </span>
          {payload ? (
            <span className="text-[10px] font-bold uppercase text-slate-500">
              Series points: {payload.series.length.toLocaleString()}
            </span>
          ) : null}
        </div>
      </Footer>
    </main>
  );
}
