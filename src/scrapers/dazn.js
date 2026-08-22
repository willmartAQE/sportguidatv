import * as cheerio from 'cheerio';

const sourceUrl = process.env.DAZN_SOURCE_URL || 'https://www.digital-news.it/palinsesti/dazn/dazn-calcio/';

function normalizeText(value = '') { return value.replace(/\s+/g, ' ').trim(); }
function dateIso(date = new Date()) { return date.toISOString().slice(0, 10); }

export async function fetchDaznFootballEvents() {
  const response = await fetch(sourceUrl, { headers: { 'user-agent': 'SportGuidaTV/0.2 contact' } });
  if (!response.ok) throw new Error(`DAZN source HTTP ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const text = normalizeText($('body').text());
  const events = [];
  const competitionMatches = [...text.matchAll(/(Serie\s*[ABC][^:.;-]{0,80})/gi)];
  for (const match of competitionMatches) {
    const context = text.slice(Math.max(0, match.index - 300), Math.min(text.length, match.index + 900));
    const time = context.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/)?.[0];
    if (!time) continue;
    const competition = /Serie\s*A/i.test(match[1]) ? 'serie-a' : /Serie\s*B/i.test(match[1]) ? 'serie-b' : 'serie-c';
    events.push({ sport: 'calcio', competition, date: dateIso(), time, title: normalizeText(match[1]), channel: 'DAZN', platform: 'DAZN', live: true, source: 'Digital-News / DAZN', sourceUrl });
  }
  return { sourceUrl, events: dedupe(events) };
}
function dedupe(events) { return [...new Map(events.map((event) => [`${event.date}|${event.time}|${event.title}|${event.channel}`, event])).values()]; }
