import { fetchSkyEvents } from '../../src/scrapers/sky.js';
import { fetchDaznFootballEvents } from '../../src/scrapers/dazn.js';
import { setCache } from '../../src/storage/cache.js';

export default async () => {
  const [sky, dazn] = await Promise.all([fetchSkyEvents(), fetchDaznFootballEvents()]);
  const events = [...sky.events, ...dazn.events];
  setCache(events);
  return new Response(JSON.stringify({ ok: true, count: events.length }), { headers: { 'content-type': 'application/json' } });
};