import { fetchSkyEvents } from '../../src/scrapers/sky.js';
import { fetchDaznFootballEvents } from '../../src/scrapers/dazn.js';
import { fetchHorseTvEvents } from '../../src/scrapers/horse-tv.js';
import { setCache } from '../../src/storage/cache.js';

export default async () => {
  const results = await Promise.allSettled([fetchSkyEvents(), fetchDaznFootballEvents(), fetchHorseTvEvents()]);
  const events = results.flatMap((result) => result.status === 'fulfilled' ? result.value.events : []);
  const errors = results.flatMap((result) => result.status === 'rejected' ? [result.reason.message] : []);
  await setCache(events);
  return new Response(JSON.stringify({ ok: true, count: events.length, errors }), { headers: { 'content-type': 'application/json' } });
};
