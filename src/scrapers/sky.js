import * as cheerio from 'cheerio';

const SKY_URL = 'https://programmi.sky.it/sky-sport';

function parseLocalEvent($, element) {
  const text = $(element).text().replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return { source: 'sky', title: text.slice(0, 240), startTime: null };
}

export async function fetchSkyEvents() {
  const response = await fetch(SKY_URL, { headers: { 'user-agent': 'Mozilla/5.0' } });
  const html = await response.text();
  console.log('Sky HTTP response', JSON.stringify({ url: SKY_URL, status: response.status, contentType: response.headers.get('content-type'), bytes: html.length }));
  const $ = cheerio.load(html);
  const candidates = $('[class*="event"], [class*="program"], article, li').toArray();
  const events = candidates.map((element) => parseLocalEvent($, element)).filter(Boolean);
  console.log('Sky parsing result', JSON.stringify({ rawMatches: candidates.length, filteredEvents: events.length }));
  return { events };
}
