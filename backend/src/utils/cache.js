/**
 * In-memory TTL cache with auto-expiry.
 * Keys are invalidated automatically after their TTL expires.
 * Callers should call del() or clear() on write operations to keep data fresh.
 */

const store = new Map();

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

export default { get, set, del, delByPrefix, clear };
