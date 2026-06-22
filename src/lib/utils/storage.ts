/**
 * Persistence layer.
 *
 * Two backends, one tiny surface:
 *   - `kv`  : small JSON values (settings, layout, dock) in localStorage.
 *   - `blobStore` : large binaries (wallpaper images/videos) in IndexedDB.
 *
 * Both are intentionally minimal and dependency-free so the whole thing can
 * later be swapped for a sync backend (iCloud/remote) behind the same API.
 */

const PREFIX = 'mynewtab:';

/** Namespaced, JSON-serialised key/value store backed by localStorage. */
export const kv = {
  get<T>(key: string, fallback: T): T {
    if (typeof localStorage === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* quota exceeded or private mode — fail silently, UI still works */
    }
  },
  remove(key: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(PREFIX + key);
  }
};

/* ---- IndexedDB blob store (wallpapers, future video) ----------------- */

const DB_NAME = 'mynewtab';
const STORE = 'blobs';
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

export const blobStore = {
  async put(key: string, blob: Blob): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  async get(key: string): Promise<Blob | null> {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as Blob) ?? null);
      req.onerror = () => reject(req.error);
    });
  },
  async delete(key: string): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};
