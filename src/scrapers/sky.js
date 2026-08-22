import * as cheerio from 'cheerio';

const SKY_URL = 'https://programmi.sky.it/sky-sport';
const TIME_RE = /\b(?:[01]\d|2[0-3]):[0-5]\d\b/;
const NOISE_RE = /^(menu|home|sky sport|scopri|guida tv|programmi tv|login|registrati)$/i;

function parseSkyEvent($, element) {
  const text = $(element).text().replace(/\s+/g, ' ').trim();
  const time = text.match(TIME_RE)?.[0];
  if (!time || text.length < 12) return null;
  const title = text.replace(time, '').replace(/\s+/g, ' ').trim();
  if (!title || NOISE_RE.test(title) || title.length < 5) return null;
  return { source: 'sky', title: title.slice(0, 240), startTime: time };
}

export async function fetchSkyEvents() {
  const response = await fetch(SKY_URL, { headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html,application/xhtml+xml' } });
  const html = await response.text();
  console.log('Sky HTTP response', JSON.stringify({ url: SKY_URL, status: response.status, contentType: response.headers.get('content-type'), bytes: html.length }));
  const $ = cheerio.load(html);
  const candidates = $('[class*="event"], [class*="program"], article, li').toArray();
  const seen = new Set();
  const events = [];
  for (const element of candidates) {
    const event = parseSkyEvent($, element);
    if (!event) continue;
    const key = `${event.startTime}|${event.title.toLowerCase()}`;
    if (!seen.has(key)) { seen.add(key); events.push(event); }
  }
  console.log('Sky parsing result', JSON.stringify({ rawMatches: candidates.length, filteredEvents: events.length }));
  return { events };
}
