import * as cheerio from 'cheerio';

const HORSE_TV_URL = 'https://www.horsetv.it/';

function parseLocalEvent($, element) {
  const text = $(element).text().replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return { source: 'horse-tv', title: text.slice(0, 240), startTime: null };
}

export async function fetchHorseTvEvents() {
  const response = await fetch(HORSE_TV_URL, { headers: { 'user-agent': 'Mozilla/5.0' } });
  const html = await response.text();
  console.log('Horse TV HTTP response', JSON.stringify({ url: HORSE_TV_URL, status: response.status, contentType: response.headers.get('content-type'), bytes: html.length }));
  const $ = cheerio.load(html);
  const candidates = $('[class*="event"], [class*="program"], article, li').toArray();
  const events = candidates.map((element) => parseLocalEvent($, element)).filter(Boolean);
  console.log('Horse TV parsing result', JSON.stringify({ rawMatches: candidates.length, filteredEvents: events.length }));
  return { events };
}
