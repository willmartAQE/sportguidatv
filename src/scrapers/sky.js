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
  ['Sky Sport 251', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-251/sky-sport/584/'],
  ['Sky Sport 252', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-252/sky-sport/585/'],
  ['Sky Sport 253', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-253/sky-sport/586/'],
  ['Sky Sport 254', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-254/sky-sport/589/'],
  ['Sky Sport 255', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-255/sky-sport/587/'],
  ['Sky Sport 256', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-256/sky-sport/588/'],
  ['Sky Sport 257', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-257/sky-sport/66/'],
  ['Sky Sport 258', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-258/sky-sport/63/'],
  ['Sky Sport 259', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-259/sky-sport/65/'],
  ['Sky Sport 260', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-260/sky-sport/67/'],
  ['Sky Sport 261', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-261/sky-sport/62/']
];
const TIME_RE = /\b(?:[01]?\d|2[0-3])(?:[:.]\d{2})\b/;

function parseChannelPage(channel, html) {
  const $ = cheerio.load(html);
  const nodes = $('body *').toArray();
  const events = [];
  const seen = new Set();
  for (const element of nodes) {
    if ($(element).children().length) continue;
    const text = $(element).text().replace(/\s+/g, ' ').trim();
    const timeMatch = text.match(TIME_RE);
    if (!timeMatch || text.length < 6) continue;
    const startTime = timeMatch[0].replace('.', ':').padStart(5, '0');
    const title = text.replace(timeMatch[0], '').replace(/IN ONDA/gi, '').trim();
    if (!title || title.length < 4 || /^\d+$/.test(title)) continue;
    const key = `${channel}|${startTime}|${title.toLowerCase()}`;
    if (!seen.has(key)) { seen.add(key); events.push({ source: 'sky', channel, title: title.slice(0, 240), startTime }); }
  }
  return { events, rawMatches: nodes.length };
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
  const events = (await Promise.all(CHANNELS.map(fetchChannel))).flat();
  console.log('Sky parsing result', JSON.stringify({ channels: CHANNELS.length, filteredEvents: events.length }));
  return { events };
}
