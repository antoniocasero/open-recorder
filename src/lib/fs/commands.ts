import { invoke } from '@tauri-apps/api/core';
import { AudioItem } from '../types';

export async function pickFolder(): Promise<string> {
  return invoke<string>('pick_folder');
}

export async function scanFolderForAudio(folderPath: string): Promise<AudioItem[]> {
  return invoke<AudioItem[]>('scan_folder_for_audio', { folderPath });
}

export async function readFileMeta(filePath: string): Promise<AudioItem> {
  return invoke<AudioItem>('read_file_meta', { filePath });
}
