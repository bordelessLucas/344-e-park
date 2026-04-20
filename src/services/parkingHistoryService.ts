import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ParkingHistoryEntry } from '../types/parkingHistory';

const STORAGE_PREFIX = '@epark:parking_history:';
const MAX_ENTRIES = 100;

const buildKey = (userId: string) => `${STORAGE_PREFIX}${userId}`;

export async function getParkingHistory(userId: string): Promise<ParkingHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(buildKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ParkingHistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch {
    return [];
  }
}

export async function addParkingHistoryEntry(
  userId: string,
  entry: Omit<ParkingHistoryEntry, 'id' | 'simulated'>
): Promise<ParkingHistoryEntry> {
  const full: ParkingHistoryEntry = {
    ...entry,
    id: `${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
    simulated: true,
  };
  const prev = await getParkingHistory(userId);
  const next = [full, ...prev].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(buildKey(userId), JSON.stringify(next));
  return full;
}
