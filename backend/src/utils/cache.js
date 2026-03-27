/**
 * In-memory TTL cache with auto-expiry, size limits, and periodic sweep.
 * Keys are invalidated automatically after their TTL expires.
 * Callers should call del() or clear() on write operations to keep data fresh.
 */

const store = new Map();
const MAX_SIZE = 5000;

function get(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

function set(key, value, ttlSeconds = 60) {
  // Evict oldest entries if at capacity (and not updating an existing key)
  if (!store.has(key) && store.size >= MAX_SIZE) {
    // Map iteration order is insertion order — first key is oldest
    const oldest = store.keys().next().value;
    store.delete(oldest);
  }

  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function del(key) {
  store.delete(key);
}

function delByPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

function clear() {
  store.clear();
}

// Periodic sweep: remove expired entries every 60s to prevent memory buildup
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) store.delete(key);
  }
}, 60_000).unref();

export default { get, set, del, delByPrefix, clear };
