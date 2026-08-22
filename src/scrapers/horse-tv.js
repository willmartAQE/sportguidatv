import * as cheerio from 'cheerio';

const sourceUrl = process.env.HORSE_TV_SOURCE_URL || 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-horse-tv-hd/sky-sport/51/';

function normalizeText(value = '') {
  return value.replace(/\s+/g, ' ').trim();
}

function dateIso(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(date);
}

export async function fetchHorseTvEvents() {
  const response = await fetch(sourceUrl, { headers: { 'user-agent': 'SportGuidaTV/0.2 contact' } });
  if (!response.ok) throw new Error(`Horse TV source HTTP ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const date = dateIso();
  const events = [];

  $('article, li, .program, .program-item, .palinsesto-item, [class*=program], [class*=palinsesto]').each((_, element) => {
    const text = normalizeText($(element).text());
    const time = text.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/)?.[0];
    if (!time) return;
    const title = normalizeText($(element).find('h1,h2,h3,h4,h5,a,[class*=title],[class*=name]').first().text()) || text.replace(time, '').trim().slice(0, 180);
    if (!title || /^horse tv hd$/i.test(title)) return;
    events.push({ sport: 'equitazione', date, time, title, channel: 'Horse TV HD', platform: 'Sky', live: true, source: 'SuperGuidaTV / Horse TV HD', sourceUrl });
  });

  return { sourceUrl, events: dedupe(events) };
}

function dedupe(events) {
  return [...new Map(events.map((event) => [`${event.date}|${event.time}|${event.title}|${event.channel}`, event])).values()];
}
