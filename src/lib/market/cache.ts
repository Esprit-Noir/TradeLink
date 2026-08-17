import { openDB, type IDBPDatabase } from "idb"
import type { Candle } from "./types"

const DB_NAME = "tradelink-market"
const STORE = "candles_v2"

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "key" })
        }
      },
    })
  }
  return dbPromise
}

export interface CachedCandles {
  key: string
  candles: Candle[]
  savedAt: number
}

export async function getCachedCandles(key: string): Promise<Candle[] | null> {
  try {
    const db = await getDb()
    const rec = (await db.get(STORE, key)) as CachedCandles | undefined
    return rec?.candles ?? null
  } catch {
    return null
  }
}

export async function setCachedCandles(key: string, candles: Candle[]): Promise<void> {
  try {
    const db = await getDb()
    await db.put(STORE, { key, candles, savedAt: Date.now() } satisfies CachedCandles)
  } catch {
    // IndexedDB unavailable (private mode, SSR) — ignore, server cache still applies
  }
}

export async function clearCachedCandles(): Promise<void> {
  try {
    const db = await getDb()
    await db.clear(STORE)
  } catch {}
}
