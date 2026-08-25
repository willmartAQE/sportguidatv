import * as cheerio from 'cheerio';

const CHANNELS = [
  ['Sky Sport24', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport24/sky-sport/36/'],
  ['Sky Sport Uno', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-uno/sky-sport/37/'],
  ['Sky Sport Calcio', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-calcio/sky-sport/572/'],
  ['Sky Sport Tennis HD', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-tennis-hd/sky-sport/598/'],
  ['Sky Sport Arena', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-arena/sky-sport/38/'],
  ['Sky Sport Basket', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-basket/sky-sport/40/'],
  ['Sky Sport Max', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-max/sky-sport/1248568499/'],
  ['Sky Sport F1 HD', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-f1-hd/sky-sport/43/'],
  ['Sky Sport MotoGP', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-motogp/sky-sport/44/'],
  ['Sky Sport Golf', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-golf/sky-sport/573/'],
  ['Eurosport HD', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-eurosport-hd/sky-sport/45/'],
  ['SuperTennis HD', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-supertennis-hd/sky-sport/53/'],
  ['Sky Sport 4K', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-4k/sky-sport/295152437/'],
  ['Equtv', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-equtv/sky-sport/1117853768/'],
  ['Horse TV HD', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-horse-tv-hd/sky-sport/51/'],
  ['RaiSport', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-raisport/sky-sport/600/'],
  ...Array.from({ length: 10 }, (_, index) => { const n = 251 + index; return [`Sky Sport ${n}`, `https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-${n}/sky-sport/${{251:584,252:585,253:586,254:589,255:587,256:588,257:66,258:63,259:65,260:67,261:62}[n]}/`]; })
];
const TIME_RE = /\b(?:[01]?\d|2[0-3]):[0-5]\d\b/;

function parseChannelPage(channel, html) {
  const $ = cheerio.load(html);
  const candidates = $('article, li, tr').toArray();
  const events = [];
  const seen = new Set();
  for (const element of candidates) {
    const text = $(element).text().replace(/\s+/g, ' ').trim();
    const timeMatch = text.match(TIME_RE);
    if (!timeMatch) continue;
    const title = text.replace(timeMatch[0], '').replace(/IN ONDA/g, '').replace(/Sport \(\d+\'\)/g, '').trim();
    if (!title || title.length < 4 || /^programmi tv/i.test(title)) continue;
    const key = `${channel}|${timeMatch[0]}|${title.toLowerCase()}`;
    if (!seen.has(key)) { seen.add(key); events.push({ source: 'sky', channel, title: title.slice(0, 240), startTime: timeMatch[0] }); }
  }
  return { events, rawMatches: candidates.length };
}

async function fetchChannel([channel, url]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html,application/xhtml+xml' } });
    const html = await response.text();
    const parsed = parseChannelPage(channel, html);
    console.log('Sky channel result', JSON.stringify({ channel, status: response.status, bytes: html.length, rawMatches: parsed.rawMatches, events: parsed.events.length }));
    return parsed.events;
  } catch (error) {
    console.error('Sky channel failed', JSON.stringify({ channel, message: error?.message || String(error) }));
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSkyEvents() {
  const batches = await Promise.all(CHANNELS.map(fetchChannel));
  const events = batches.flat();
  console.log('Sky parsing result', JSON.stringify({ channels: CHANNELS.length, filteredEvents: events.length }));
  return { events };
}
