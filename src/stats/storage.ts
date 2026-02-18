import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = 'lnreader_daily_stats';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function addPagesReadToday(pages: number): Promise<void> {
  if (pages <= 0) return;
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    const data: Record<string, number> = raw ? JSON.parse(raw) : {};
    const today = getTodayKey();
    data[today] = (data[today] ?? 0) + pages;
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export async function getPagesReadToday(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    const data: Record<string, number> = raw ? JSON.parse(raw) : {};
    const today = getTodayKey();
    return data[today] ?? 0;
  } catch {
    return 0;
  }
}
