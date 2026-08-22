let memoryCache = { updatedAt: null, events: [] };

export function getCache() {
  return memoryCache;
}

export function setCache(events) {
  memoryCache = {
    updatedAt: new Date().toISOString(),
    events: Array.isArray(events) ? events : []
  };
  return memoryCache;
}
