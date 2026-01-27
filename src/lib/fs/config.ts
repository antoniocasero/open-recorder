import { load, Store } from '@tauri-apps/plugin-store';
import type { EditorUiState } from '../editor/state';
import { DEFAULT_EDITOR_STATE } from '../editor/state';

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