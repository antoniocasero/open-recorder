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
  const all = await s.get<TranscriptionMetaByPath>('transcriptionMetaByPath');
  return all ?? {};
}

export async function getTranscriptionMeta(audioPath: string): Promise<TranscriptionMeta | null> {
  const all = await getAllTranscriptionMeta();
  return all[audioPath] ?? null;
}

export async function setTranscriptionMeta(audioPath: string, meta: TranscriptionMeta): Promise<void> {
  const s = await getStore();
  const all = (await s.get<TranscriptionMetaByPath>('transcriptionMetaByPath')) ?? {};
  all[audioPath] = meta;
  await s.set('transcriptionMetaByPath', all);
  await s.save();
}
