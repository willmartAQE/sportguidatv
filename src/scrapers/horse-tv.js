import * as cheerio from 'cheerio';

const sourceUrl = process.env.HORSE_TV_SOURCE_URL || 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-horse-tv-hd/sky-sport/51/';

function normalizeText(value = '') { return value.replace(/\s+/g, ' ').trim(); }
function dateIso(date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(date); }

function parseItalianDate(value) {
  const match = value.match(/(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})/i);
  if (!match) return null;
  const months = { gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5, luglio: 6, agosto: 7, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11 };
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date(Date.UTC(Number(match[3]), months[match[2].toLowerCase()], Number(match[1]))));
}

export async function fetchHorseTvEvents() {
  const response = await fetch(sourceUrl, { headers: { 'user-agent': 'SportGuidaTV/0.2 contact' } });
  if (!response.ok) throw new Error(`Horse TV source HTTP ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const bodyText = normalizeText($('body').text());
  const pageDate = parseItalianDate(bodyText);
  const today = dateIso();
  if (pageDate && pageDate !== today) return { sourceUrl, events: [], error: `Horse TV schedule is stale: ${pageDate}` };
  if (!pageDate) return { sourceUrl, events: [], error: 'Horse TV schedule date not found' };
  const events = [];
  const seen = new Set();
  const timePattern = /\b([01]?\d|2[0-3]):[0-5]\d\b/g;
  $('article, li, .program, .program-item, .palinsesto-item, [class*=program], [class*=palinsesto]').each((_, element) => {
    const text = normalizeText($(element).text());
    const time = text.match(timePattern)?.[0];
    if (!time) return;
    const title = normalizeText($(element).find('h1,h2,h3,h4,h5,a,[class*=title],[class*=name]').first().text()) || text.replace(time, '').trim().slice(0, 180);
    if (!title || /^horse tv hd$/i.test(title)) return;
    const key = `${pageDate}|${time}|${title}`;
    if (seen.has(key)) return;
    seen.add(key);
    events.push({ sport: 'equitazione', date: pageDate, time, title, channel: 'Horse TV HD', platform: 'Sky', live: true, source: 'SuperGuidaTV / Horse TV HD', sourceUrl });
  });
  return { sourceUrl, events };
}
