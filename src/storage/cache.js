import { getStore } from '@netlify/blobs';

let memoryCache = { events: [] };

function getCacheStore() {
  try {
    return getStore('sportguidatv-cache');
  } catch {
    return null;
  }
}

export async function setCache(events = []) {
  const payload = { events, updatedAt: new Date().toISOString() };
  memoryCache = payload;

  const store = getCacheStore();
  if (store) {
    try {
      await store.setJSON('events_data', payload);
    } catch (err) {
      console.warn('Errore scrittura su Netlify Blobs:', err?.message || err);
    }
  }
}

export async function getCache() {
  const store = getCacheStore();
  if (store) {
    try {
      const data = await store.getJSON('events_data');
      if (data && Array.isArray(data.events)) {
        return data;
      }
    } catch (err) {
      console.warn('Errore lettura da Netlify Blobs:', err?.message || err);
    }
  }
  return memoryCache;
}
