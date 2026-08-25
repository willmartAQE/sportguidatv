import * as cheerio from 'cheerio';

const SKY_URL = 'https://programmi.sky.it/sky-sport';
const TIME_RE = /\b(?:[01]?\d|2[0-3])(?:[:.]\d{2})\b/;
const NOISE_RE = /^(menu|home|sky sport|scopri|guida tv|programmi tv|login|registrati)$/i;

function parseSkyEvent($, element) {
  const text = $(element).clone().children().remove().end().text().replace(/\s+/g, ' ').trim();
  const timeMatch = text.match(TIME_RE);
  if (!timeMatch) return null;
  const startTime = timeMatch[0].replace('.', ':').padStart(5, '0');
  const title = text.replace(timeMatch[0], '').replace(/\s+/g, ' ').trim();
  if (!title || title.length < 5 || NOISE_RE.test(title)) return null;
  return { source: 'sky', title: title.slice(0, 240), startTime };
}

export async function fetchSkyEvents() {
  const response = await fetch(SKY_URL, { headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html,application/xhtml+xml' } });
  const html = await response.text();
  console.log('Sky HTTP response', JSON.stringify({ url: SKY_URL, status: response.status, contentType: response.headers.get('content-type'), bytes: html.length }));
  const $ = cheerio.load(html);
  const candidates = $('[class*="event"], [class*="program"], article, li').toArray();
  const seen = new Set();
  const events = [];
  const rejectedSamples = [];
  for (const element of candidates) {
    const event = parseSkyEvent($, element);
    if (!event) {
      if (rejectedSamples.length < 5) rejectedSamples.push($(element).text().replace(/\s+/g, ' ').trim().slice(0, 180));
      continue;
    }
    const key = `${event.startTime}|${event.title.toLowerCase()}`;
    if (!seen.has(key)) { seen.add(key); events.push(event); }
  }
  console.log('Sky parsing result', JSON.stringify({ rawMatches: candidates.length, filteredEvents: events.length, rejectedSamples }));
  return { events };
}
