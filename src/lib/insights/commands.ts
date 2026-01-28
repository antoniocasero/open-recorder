import { invoke } from '@tauri-apps/api/core';

import type { GetLibraryInsightsArgs, LibraryInsightsPayload } from './types';

export async function getLibraryInsights(
  args: GetLibraryInsightsArgs,
): Promise<LibraryInsightsPayload> {
  const { folderPath, preset, transcriptionMetaByPath } = args;

  return invoke<LibraryInsightsPayload>('get_library_insights', {
    folderPath,
    preset,
    transcriptionMetaByPath,
  });
}
