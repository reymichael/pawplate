/**
 * Feeding Log — localStorage-based meal tracking.
 * Stores feeding entries per pet keyed by `pawplate_feeding_logs`.
 * No Supabase required; device-local storage is ideal for daily tracking.
 */

export interface FeedingLog {
  id: string
  pet_id: string
  recipe_id: string
  recipe_name: string
  kcal: number
  weight_g: number
  notes: string
  fed_at: string // ISO 8601 datetime string
}

const STORAGE_KEY = 'pawplate_feeding_logs'

// ── Read ──────────────────────────────────────────────────────────────────────

export function getAllLogs(): FeedingLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FeedingLog[]) : []
  } catch {
    return []
  }
}

export function getLogsForPet(petId: string): FeedingLog[] {
  return getAllLogs().filter(l => l.pet_id === petId)
}

/** Returns total kcal logged today (local date) for a given pet. */
export function getTodayKcalForPet(petId: string): number {
  const todayStr = new Date().toDateString()
  return getLogsForPet(petId)
    .filter(l => new Date(l.fed_at).toDateString() === todayStr)
    .reduce((sum, l) => sum + l.kcal, 0)
}

// ── Write ─────────────────────────────────────────────────────────────────────

export function addLog(entry: Omit<FeedingLog, 'id'>): FeedingLog {
  const log: FeedingLog = { ...entry, id: crypto.randomUUID() }
  const all = getAllLogs()
  all.unshift(log) // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return log
}

export function deleteLog(id: string): void {
  const all = getAllLogs().filter(l => l.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}
