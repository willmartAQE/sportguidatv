import * as cheerio from 'cheerio';

const CHANNELS = [
  ['Sky Sport24', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport24/sky-sport/36/'], ['Sky Sport Uno', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-uno/sky-sport/37/'], ['Sky Sport Calcio', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-calcio/sky-sport/572/'], ['Sky Sport Tennis HD', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-tennis-hd/sky-sport/598/'], ['Sky Sport Arena', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-arena/sky-sport/38/'], ['Sky Sport Basket', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-basket/sky-sport/40/'], ['Sky Sport Max', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-max/sky-sport/1248568499/'], ['Sky Sport F1 HD', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-f1-hd/sky-sport/43/'], ['Sky Sport MotoGP', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-motogp/sky-sport/44/'], ['Sky Sport Golf', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-golf/sky-sport/573/'], ['Eurosport HD', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-eurosport-hd/sky-sport/45/'], ['SuperTennis HD', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-supertennis-hd/sky-sport/53/'], ['Sky Sport 4K', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-4k/sky-sport/295152437/'], ['Equtv', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-equtv/sky-sport/1117853768/'], ['Horse TV HD', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-horse-tv-hd/sky-sport/51/'], ['RaiSport', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-raisport/sky-sport/600/'], ...Array.from({ length: 10 }, (_, i) => { const n = 251 + i; const ids = [584,585,586,589,587,588,66,63,65,67]; return [`Sky Sport ${n}`, `https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-${n}/sky-sport/${ids[i]}/`]; }), ['Sky Sport 261', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-261/sky-sport/62/']
];
const TIME_RE = /\b(?:[01]?\d|2[0-3])[:.]\d{2}\b/g;

function clean(value) {
  return value.replace(/\s+/g, ' ').replace(/\bIN ONDA\b/gi, '').replace(/^(?:Sport|Rubrica|Film|Serie TV|Documentari)\s*\(\d+['’]?\)\s*/i, '').trim();
}

function parseChannelPage(channel, html) {
  const $ = cheerio.load(html);
  const text = $('body').text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const matches = [...text.matchAll(TIME_RE)];
  const events = [];
  const seen = new Set();
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const startTime = match[0].replace('.', ':').padStart(5, '0');
    const end = matches[i + 1]?.index ?? Math.min(text.length, match.index + 400);
    const title = clean(text.slice(match.index + match[0].length, end)).slice(0, 240);
    if (!title || title.length < 3 || /^\d+$/.test(title) || /programmazione|guida ai programmi|canale numero/i.test(title)) continue;
    const key = `${channel}|${startTime}|${title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    events.push({ source: 'sky', channel, title, startTime });
  }
  return events;
}

async function fetchChannel([channel, url]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html,application/xhtml+xml' } });
    const html = await response.text();
    const events = parseChannelPage(channel, html);
    console.log('Sky channel result', JSON.stringify({ channel, status: response.status, bytes: html.length, events: events.length }));
    return events;
  } catch (error) {
    console.error('Sky channel failed', JSON.stringify({ channel, message: error?.message || String(error) }));
    return [];
  } finally { clearTimeout(timeout); }
}

export async function fetchSkyEvents() {
  const events = (await Promise.all(CHANNELS.map(fetchChannel))).flat();
  console.log('Sky parsing result', JSON.stringify({ channels: CHANNELS.length, filteredEvents: events.length }));
  return { events };
}
