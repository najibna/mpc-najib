type Entry = { data: unknown; at: number };

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();
const TTL_MS = 5 * 60 * 1000;

let dataVersion = 0;
const listeners = new Set<() => void>();

export function getDataVersion(): number {
  return dataVersion;
}

export function subscribeDataVersion(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function invalidateCache(): void {
  store.clear();
  inflight.clear();
  dataVersion += 1;
  listeners.forEach((fn) => fn());
}

/** Seed a single cache key (used by bundled demo data). */
export function seedCacheEntry(key: string, data: unknown): void {
  store.set(key, { data, at: Date.now() });
}

export async function cached<T>(key: string, fetcher: () => Promise<T>, force = false): Promise<T> {
  if (!force) {
    const hit = store.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
      return hit.data as T;
    }
    const pending = inflight.get(key);
    if (pending) return pending as Promise<T>;
  }

  const promise = fetcher().then((data) => {
    store.set(key, { data, at: Date.now() });
    inflight.delete(key);
    return data;
  }).catch((err) => {
    inflight.delete(key);
    throw err;
  });
  inflight.set(key, promise);
  return promise;
}

/** Pre-populate client cache from a bundled /home response. */
export function seedFromHome(home: Record<string, unknown>): void {
  const at = Date.now();
  const put = (key: string, data: unknown) => store.set(key, { data, at });
  put("home", home);
  put("meta", home.meta);
  put("overview", home.overview);
  put("command-center", home.command_center);
  put("budgets", home.budgets);
  put("action-items", home.action_items);
  put("demo-insights", home.demo_insights);
}
