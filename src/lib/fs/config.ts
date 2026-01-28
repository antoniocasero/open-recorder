import { load, Store } from '@tauri-apps/plugin-store';
import type { EditorUiState } from '../editor/state';
import { DEFAULT_EDITOR_STATE } from '../editor/state';

export type EditorActionsCompletionMap = Record<string, boolean>;

export type TranscriptionMeta = {
  language: string;
  transcribedAt: number;
  transcriptionSeconds?: number;
  audioSeconds?: number;
};

function sanitizeTranscriptionMeta(meta: TranscriptionMeta): { meta: TranscriptionMeta; changed: boolean } {
  if (meta.transcriptionSeconds === 0 && meta.audioSeconds == null) {
    const sanitized = { ...meta };
    delete sanitized.transcriptionSeconds;
    return { meta: sanitized, changed: true };
  }
  return { meta, changed: false };
}

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await load('config.json');
  }
  return store;
}

export async function getLastFolder(): Promise<string | null> {
  const s = await getStore();
  const value = await s.get<string>('lastFolder');
  return value ?? null;
}

export async function setLastFolder(path: string): Promise<void> {
  const s = await getStore();
  await s.set('lastFolder', path);
  await s.save();
}

export async function getEditorState(): Promise<EditorUiState> {
  const s = await getStore();
  const stored = await s.get<EditorUiState>('editorState');
  if (!stored) {
    return DEFAULT_EDITOR_STATE;
  }
  return { ...DEFAULT_EDITOR_STATE, ...stored };
}

export async function setEditorState(nextState: EditorUiState): Promise<void> {
  const s = await getStore();
  await s.set('editorState', nextState);
  await s.save();
}

type EditorActionsCompletionByRecording = Record<string, EditorActionsCompletionMap>;

export async function getEditorActionsCompletion(recordingPath: string): Promise<EditorActionsCompletionMap> {
  const s = await getStore();
  const all = await s.get<EditorActionsCompletionByRecording>('editorActionsCompletion');
  return all?.[recordingPath] ?? {};
}

export async function setEditorActionsCompletion(
  recordingPath: string,
  completion: EditorActionsCompletionMap,
): Promise<void> {
  const s = await getStore();
  const all = (await s.get<EditorActionsCompletionByRecording>('editorActionsCompletion')) ?? {};
  all[recordingPath] = completion;
  await s.set('editorActionsCompletion', all);
  await s.save();
}

type TranscriptionMetaByPath = Record<string, TranscriptionMeta>;

export async function getAllTranscriptionMeta(): Promise<TranscriptionMetaByPath> {
  const s = await getStore();
  const all = (await s.get<TranscriptionMetaByPath>('transcriptionMetaByPath')) ?? {};
  let repairedCount = 0;
  const sanitized: TranscriptionMetaByPath = {};

  for (const [audioPath, meta] of Object.entries(all)) {
    const { meta: normalized, changed } = sanitizeTranscriptionMeta(meta);
    sanitized[audioPath] = normalized;
    if (changed) {
      repairedCount += 1;
    }
  }

  if (repairedCount > 0) {
    await s.set('transcriptionMetaByPath', sanitized);
    await s.save();
    console.warn(
      `Repaired ${repairedCount} transcriptionMetaByPath entries (removed transcriptionSeconds=0 when audioSeconds missing)`,
    );
  }

  return sanitized;
}

export async function getTranscriptionMeta(audioPath: string): Promise<TranscriptionMeta | null> {
  const all = await getAllTranscriptionMeta();
  return all[audioPath] ?? null;
}

export async function setTranscriptionMeta(audioPath: string, meta: TranscriptionMeta): Promise<void> {
  const s = await getStore();
  const all = (await s.get<TranscriptionMetaByPath>('transcriptionMetaByPath')) ?? {};
  const { meta: sanitized } = sanitizeTranscriptionMeta(meta);
  all[audioPath] = sanitized;
  await s.set('transcriptionMetaByPath', all);
  await s.save();
}
