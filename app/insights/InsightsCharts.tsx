'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ReactNode } from 'react';

import type { LibraryInsightsPayload } from '@/lib/insights/types';

type Props = {
  payload: LibraryInsightsPayload;
  seriesLabels: Record<number, string>;
};

const CHART_COLORS = ['#60a5fa', '#22c55e', '#eab308', '#f97316', '#f43f5e', '#a78bfa', '#38bdf8'];

function ChartCard({ title, children, className }: { title: string; children: ReactNode; className: string }) {
  return (
    <div className={`rounded-xl border border-slate-border bg-slate-panel/60 p-4 ${className}`}>
      <div className="text-sm font-semibold text-slate-200">{title}</div>
      <div className="mt-4 h-[calc(100%-2.5rem)]">{children}</div>
    </div>
  );
}

export function InsightsCharts({ payload, seriesLabels }: Props) {
  const seriesData = payload.series.map((point) => ({
    day: seriesLabels[point.dayStartUnix] ?? String(point.dayStartUnix),
    recordedMinutes: point.recordingSeconds / 60,
    transcribedMinutes: point.transcribedSeconds / 60,
  }));

  const bucketData = payload.durationBuckets.map((bucket) => ({
    label: bucket.label,
    count: bucket.count,
  }));

  const languageData = payload.languageDistribution.map((item) => ({
    language: item.language?.trim() ? item.language : 'unknown',
    minutes: item.transcribedSeconds / 60,
  }));

  const fileTypeData = payload.fileTypeDistribution.map((item) => ({
    ext: item.ext?.trim() ? item.ext : 'unknown',
    minutes: item.seconds / 60,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Minutes per day" className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={seriesData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="recordedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="transcribedFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="recordedMinutes"
              name="Recorded"
              stroke="#60a5fa"
              fill="url(#recordedFill)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="transcribedMinutes"
              name="Transcribed"
              stroke="#22c55e"
              fill="url(#transcribedFill)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Duration buckets" className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bucketData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="count" fill="#38bdf8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Language distribution" className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            <Pie
              data={languageData}
              dataKey="minutes"
              nameKey="language"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
            >
              {languageData.map((_, idx) => (
                <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="File types" className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={fileTypeData} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 0 }}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} />
            <YAxis
              type="category"
              dataKey="ext"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: '#334155' }}
              width={70}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="minutes" fill="#a78bfa" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
