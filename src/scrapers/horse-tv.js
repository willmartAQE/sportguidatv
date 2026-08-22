import * as cheerio from 'cheerio';
import { parseEvents } from '../parser/events.js';

const HORSE_TV_URL = 'https://www.horsetv.it/';

export async function fetchHorseTvEvents() {
  const response = await fetch(HORSE_TV_URL, { headers: { 'user-agent': 'Mozilla/5.0' } });
  const html = await response.text();
  console.log('Horse TV HTTP response', JSON.stringify({ url: HORSE_TV_URL, status: response.status, contentType: response.headers.get('content-type'), bytes: html.length }));
  const $ = cheerio.load(html);
  const rawMatches = $('[class*="event"], [class*="program"], article, li').length;
  const events = parseEvents($);
  console.log('Horse TV parsing result', JSON.stringify({ rawMatches, filteredEvents: events.length }));
  return { events };
}
