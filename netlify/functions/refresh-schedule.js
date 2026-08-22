import { fetchSkyEvents } from '../../src/scrapers/sky.js';
import { fetchDaznFootballEvents } from '../../src/scrapers/dazn.js';
import { fetchHorseTvEvents } from '../../src/scrapers/horse-tv.js';
import { setCache } from '../../src/storage/cache.js';

export const config = { schedule: '*/15 * * * *' };

export default async () => {
  console.log('Schedule refresh started');
  const sources = [
    ['sky', fetchSkyEvents],
    ['dazn', fetchDaznFootballEvents],
    ['horse-tv', fetchHorseTvEvents]
  ];
  const results = await Promise.all(sources.map(async ([name, fetcher]) => {
    const startedAt = Date.now();
    try {
      const result = await fetcher();
      const events = result?.events || [];
      console.log('Scraper result', JSON.stringify({ name, ok: true, count: events.length, reportedError: result?.error || null, durationMs: Date.now() - startedAt }));
      return { name, ok: true, count: events.length, error: result?.error || null, events };
    } catch (error) {
      console.error('Scraper failed', JSON.stringify({ name, message: error?.message || String(error), stack: error?.stack || null, durationMs: Date.now() - startedAt }));
      return { name, ok: false, count: 0, error: error?.message || String(error), events: [] };
    }
  }));
  const events = results.flatMap((result) => result.events);
  console.log('Cache write started', JSON.stringify({ count: events.length }));
  await setCache(events);
  console.log('Cache write completed', JSON.stringify({ count: events.length }));
  const summary = { ok: true, count: events.length, sources: results.map(({ name, ok, count, error }) => ({ name, ok, count, error })) };
  console.log('Schedule refresh completed', JSON.stringify(summary));
  return new Response(JSON.stringify(summary), { headers: { 'content-type': 'application/json' } });
};
