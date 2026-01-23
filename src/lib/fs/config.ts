import { load, Store } from '@tauri-apps/plugin-store';

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
