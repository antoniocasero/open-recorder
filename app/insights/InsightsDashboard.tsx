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

const TOPIC_PILLS = [
  { label: 'User Experience' },
  { label: 'Web Development' },
  { label: 'Product Roadmap' },
  { label: 'Project Alpha', featured: true },
  { label: 'Stakeholder Feedback' },
  { label: 'Accessibility' },
  { label: 'Budgeting' },
  { label: 'Design Systems' },
];

const TOP_KEYWORDS = [
  { label: 'Deployment', mentions: 128, pct: 0.85 },
  { label: 'User Feedback', mentions: 94, pct: 0.65 },
  { label: 'Validation', mentions: 72, pct: 0.48 },
  { label: 'Legacy Code', mentions: 55, pct: 0.35 },
];

const RECENT_TRENDS = [
  {
    icon: 'trending_up',
    tone: 'text-indigo-400',
    border: 'border-l-indigo-500/40',
    label: 'Mentioned 12x today',
    excerpt: '"...it\'s crucial that we address the latency issues in the dashboard component before the Q4 release..."',
    source: 'Engineering Sync',
  },
  {
    icon: 'check_circle',
    tone: 'text-emerald-400',
    border: 'border-l-emerald-500/40',
    label: 'Resolved theme',
    excerpt:
      '"...everyone agreed that the indigo palette provides better contrast than the previous slate-only version..."',
    source: 'Design Review',
  },
  {
    icon: 'priority_high',
    tone: 'text-amber-400',
    border: 'border-l-amber-400/50',
    label: 'Urgent concern',
    excerpt: '"...several users reported confusion regarding the global search placement on the insights page..."',
    source: 'UX Interview #12',
  },
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

function InsightsOverview({
  summary,
  query,
  onQueryChange,
}: {
  summary: string;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-border bg-gradient-to-br from-slate-900/40 via-slate-panel/40 to-slate-panel/10 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Aggregated AI Insights</h2>
          <p className="mt-2 text-sm text-slate-400">{summary}</p>
        </div>
        <div className="relative w-full lg:max-w-xl">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search across all transcripts for keywords, topics, or speakers..."
            className="w-full rounded-xl border border-slate-border bg-slate-900/70 py-3 pl-12 pr-4 text-sm text-slate-200 placeholder:text-slate-500 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
      </div>
    </div>
  );
}

function TopicCloud() {
  return (
    <div className="rounded-2xl border border-slate-border bg-slate-panel/50 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Topic cloud</h3>
        <span className="text-[10px] font-medium text-slate-500">Last 30 days</span>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {TOPIC_PILLS.map((topic) => (
          <span
            key={topic.label}
            className={
              topic.featured
                ? 'rounded-full border border-indigo-500/40 bg-indigo-500/10 px-4 py-2 text-[13px] font-semibold text-indigo-300 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-400/20'
                : 'rounded-full border border-slate-700 bg-slate-900/50 px-4 py-2 text-[13px] text-slate-300 transition hover:border-indigo-400/50 hover:bg-indigo-500/10 hover:text-indigo-200'
            }
          >
            {topic.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TopKeywords() {
  return (
    <div className="rounded-2xl border border-slate-border bg-slate-panel/50 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Top keywords</h3>
        <button type="button" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-200">
          Full report
        </button>
      </div>
      <div className="mt-6 space-y-4">
        {TOP_KEYWORDS.map((keyword) => (
          <div key={keyword.label} className="space-y-2">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-tight text-slate-400">
              <span>{keyword.label}</span>
              <span>{keyword.mentions} mentions</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-400/70"
                style={{ width: `${Math.round(keyword.pct * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentTrends() {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent trends in transcripts</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {RECENT_TRENDS.map((trend) => (
          <div
            key={trend.label}
            className={`rounded-xl border border-slate-border bg-slate-panel/40 p-4 transition-colors hover:bg-slate-panel/60 border-l-2 ${trend.border}`}
          >
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-sm ${trend.tone}`}>{trend.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{trend.label}</span>
            </div>
            <p className="mt-3 text-[13px] text-slate-200 line-clamp-3">{trend.excerpt}</p>
            <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500">
              <span>{trend.source}</span>
              <span className="material-symbols-outlined text-sm text-slate-600">arrow_forward</span>
            </div>
          </div>
        ))}
      </div>
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
  const [searchQuery, setSearchQuery] = useState('');

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

  const overviewSummary = useMemo(() => {
    if (!payload || !payload.kpis) {
      return 'Analyzing patterns across your recent recordings and transcripts.';
    }

    const recordings = payload.kpis.totalRecordings.toLocaleString();
    const hours = (payload.kpis.totalRecordingSeconds / 3600).toFixed(1);
    return `Analyzing patterns across ${recordings} recordings and ${hours} hours of conversation.`;
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
            <div className="space-y-8">
              <InsightsOverview
                summary={overviewSummary}
                query={searchQuery}
                onQueryChange={setSearchQuery}
              />
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
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <TopicCloud />
                <TopKeywords />
              </div>
              <RecentTrends />
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
