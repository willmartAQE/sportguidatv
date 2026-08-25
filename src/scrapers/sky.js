import * as cheerio from 'cheerio';

const CHANNELS = [
  ['Sky Sport Uno', 'https://www.superguidatv.it/programmazione-canale/oggi/guida-programmi-tv-sky-sport-uno/sky-sport/37/']
];
const TIME_RE = /\b(?:[01]?\d|2[0-3])(?::|\.)[0-5]\d\b/;

function inspectMarkup(channel, html) {
  const $ = cheerio.load(html);
  const times = $('time').map((_, element) => $(element).text().trim() || $(element).attr('datetime') || '').get().slice(0, 20);
  const dataAttributes = [];
  $('[data-time], [data-start], [data-date], [data-datetime], [data-program]').each((_, element) => {
    if (dataAttributes.length >= 20) return;
    dataAttributes.push({ tag: element.tagName, time: $(element).attr('data-time'), start: $(element).attr('data-start'), date: $(element).attr('data-date'), datetime: $(element).attr('data-datetime'), program: $(element).attr('data-program') });
  });
  const scripts = $('script').map((_, element) => $(element).html() || '').get().filter((text) => /programma|palinsesto|schedule|startTime|\d{1,2}[:.]\d{2}/i.test(text)).slice(0, 5).map((text) => text.slice(0, 500));
  const textSamples = $('article, li, tr, div').map((_, element) => $(element).text().replace(/\s+/g, ' ').trim()).get().filter((text) => TIME_RE.test(text) || /\b\d{1,2}[.]\d{2}\b/.test(text)).slice(0, 10).map((text) => text.slice(0, 240));
  console.log('Sky markup diagnostics', JSON.stringify({ channel, times, dataAttributes, scripts, textSamples }));
}

async function fetchChannel([channel, url]) {
  const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0', accept: 'text/html,application/xhtml+xml' } });
  const html = await response.text();
  inspectMarkup(channel, html);
  return [];
}

export async function fetchSkyEvents() {
  await Promise.all(CHANNELS.map(fetchChannel));
  console.log('Sky parsing result', JSON.stringify({ channels: CHANNELS.length, filteredEvents: 0 }));
  return { events: [] };
}
