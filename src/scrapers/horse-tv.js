import * as cheerio from 'cheerio';

const HORSE_TV_URL = 'https://www.horsetv.it/';

function parseLocalEvent($, element) {
  const text = $(element).text().replace(/\s+/g, ' ').trim();
  if (!text || text.length < 8) return null;
  return { source: 'horse-tv', title: text.slice(0, 240), startTime: null };
}

export async function fetchHorseTvEvents() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(HORSE_TV_URL, { signal: controller.signal, headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html,application/xhtml+xml' } });
    const html = await response.text();
    console.log('Horse TV HTTP response', JSON.stringify({ url: HORSE_TV_URL, status: response.status, contentType: response.headers.get('content-type'), bytes: html.length }));
    const $ = cheerio.load(html);
    const candidates = $('[class*="event"], [class*="program"], article, li').toArray();
    const events = candidates.map((element) => parseLocalEvent($, element)).filter(Boolean);
    console.log('Horse TV parsing result', JSON.stringify({ rawMatches: candidates.length, filteredEvents: events.length }));
    return { events };
  } catch (error) {
    console.error('Horse TV request failed', JSON.stringify({ name: error?.name || null, message: error?.message || String(error) }));
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
