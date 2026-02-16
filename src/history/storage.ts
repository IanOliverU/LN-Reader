import AsyncStorage from '@react-native-async-storage/async-storage';

import type { HistoryEntry } from './types';

const HISTORY_KEY = 'lnreader_history';
const MAX_ENTRIES = 100;

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function saveToHistory(
  entry: Omit<HistoryEntry, 'id' | 'readAt'>
): Promise<void> {
  try {
    const id = `${entry.folder}|${entry.pdfFilename}`;
    const readAt = Date.now();
    const newEntry: HistoryEntry = { ...entry, id, readAt };
    const list = await getHistory();
    const filtered = list.filter((e) => e.id !== id);
    const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
