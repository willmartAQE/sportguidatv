import * as cheerio from 'cheerio';
import { parseEvent } from '../parser/events.js';

const SKY_URL = 'https://programmi.sky.it/sky-sport';

export async function fetchSkyEvents() {
  const response = await fetch(SKY_URL, { headers: { 'user-agent': 'Mozilla/5.0' } });
  const html = await response.text();
  console.log('Sky HTTP response', JSON.stringify({ url: SKY_URL, status: response.status, contentType: response.headers.get('content-type'), bytes: html.length }));
  const $ = cheerio.load(html);
  const rawMatches = $('[class*="event"], [class*="program"], article, li').length;
  const events = $('article, li').toArray().map((element) => parseEvent($(element))).filter(Boolean);
  console.log('Sky parsing result', JSON.stringify({ rawMatches, filteredEvents: events.length }));
  return { events };
}
