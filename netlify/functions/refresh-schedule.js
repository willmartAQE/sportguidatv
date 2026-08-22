import { fetchSkyEvents } from '../../src/scrapers/sky.js';
import { fetchDaznFootballEvents } from '../../src/scrapers/dazn.js';
import { fetchHorseTvEvents } from '../../src/scrapers/horse-tv.js';
import { setCache } from '../../src/storage/cache.js';

export default async () => {
  const sources = [
    ['sky', fetchSkyEvents],
    ['dazn', fetchDaznFootballEvents],
    ['horse-tv', fetchHorseTvEvents]
  ];
  const results = await Promise.all(sources.map(async ([name, fetcher]) => {
    try {
      const result = await fetcher();
      return { name, ok: true, count: result.events?.length || 0, error: result.error || null, events: result.events || [] };
    } catch (error) {
      return { name, ok: false, count: 0, error: error?.message || String(error), events: [] };
    }
  }));
  const events = results.flatMap((result) => result.events);
  await setCache(events);
  return new Response(JSON.stringify({ ok: true, count: events.length, sources: results.map(({ name, ok, count, error }) => ({ name, ok, count, error })) }), { headers: { 'content-type': 'application/json' } });
};
