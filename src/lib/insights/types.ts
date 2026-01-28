export type InsightsRangePreset = '7d' | '30d' | '90d' | 'all';

export interface InsightsSeriesPoint {
  dayStartUnix: number;
  recordingSeconds: number;
  transcribedSeconds: number;
  recordings: number;
}

export interface InsightsBucket {
  id: string;
  label: string;
  count: number;
  seconds: number;
}

export interface InsightsKpis {
  totalRecordings: number;
  totalRecordingSeconds: number;
  transcribedRecordings: number;
  transcribedSeconds: number;
  transcriptionCoveragePct: number;
}

export interface InsightsRecordingRow {
  id: string;
  name: string;
  path: string;
  mtimeUnix: number;
  durationSeconds: number | null;
  hasTranscript: boolean;
  language: string;
}

export interface LanguageDistributionItem {
  language: string;
  count: number;
  transcribedSeconds: number;
}

export interface FileTypeDistributionItem {
  ext: string;
  count: number;
  seconds: number;
}

export interface LibraryInsightsPayload {
  preset: InsightsRangePreset;
  kpis: InsightsKpis;
  series: InsightsSeriesPoint[];
  durationBuckets: InsightsBucket[];
  languageDistribution: LanguageDistributionItem[];
  fileTypeDistribution: FileTypeDistributionItem[];
  recent: InsightsRecordingRow[];
}

export interface TranscriptionMetaItem {
  language: string;
  transcriptionSeconds?: number | null;
}

export interface GetLibraryInsightsArgs {
  folderPath: string;
  preset: InsightsRangePreset;
  transcriptionMetaByPath?: Record<string, TranscriptionMetaItem>;
}
