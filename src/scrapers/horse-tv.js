import * as cheerio from 'cheerio';

const HORSE_TV_URL = 'https://guidaoggiintv.it/guida-tv-canale/Horse-tv/oggi';
const TIME_RE = /\b(?:[01]\d|2[0-3]):[0-5]\d\b/;

function parseHorseEvent($, element) {
  const text = $(element).text().replace(/\s+/g, ' ').trim();
  const time = text.match(TIME_RE)?.[0];
  if (!time || text.length < 8) return null;
  const title = text.replace(time, '').replace(/IN ONDA/g, '').trim();
  if (!title) return null;
  return { source: 'horse-tv', title: title.slice(0, 240), startTime: time };
}

export async function fetchHorseTvEvents() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(HORSE_TV_URL, { signal: controller.signal, headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html,application/xhtml+xml' } });
    const html = await response.text();
    console.log('Horse TV HTTP response', JSON.stringify({ url: HORSE_TV_URL, status: response.status, contentType: response.headers.get('content-type'), bytes: html.length }));
    const $ = cheerio.load(html);
    const seen = new Set();
    const events = [];
    $('article, li, tr').each((_, element) => {
      const event = parseHorseEvent($, element);
      if (!event) return;
      const key = `${event.startTime}|${event.title.toLowerCase()}`;
      if (!seen.has(key)) { seen.add(key); events.push(event); }
    });
    console.log('Horse TV parsing result', JSON.stringify({ rawMatches: $('article, li, tr').length, filteredEvents: events.length }));
    return { events };
  } finally {
    clearTimeout(timeout);
  }
}
