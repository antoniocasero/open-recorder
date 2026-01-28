import type { LibraryInsightsPayload } from './types';

import { downloadFile } from '@/lib/transcription/export';

export async function exportInsightsReport(payload: LibraryInsightsPayload): Promise<void> {
  const filename = `open-recorder-insights-${payload.preset}.json`;
  const content = JSON.stringify(payload, null, 2);
  await downloadFile(content, filename);
}
