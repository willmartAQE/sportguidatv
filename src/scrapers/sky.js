import * as cheerio from 'cheerio';

const sourceUrl = process.env.SKY_SOURCE_URL || 'https://programmi.sky.it/sport';

function normalizeText(value = '') { return value.replace(/\s+/g, ' ').trim(); }
function dateIso(date = new Date()) { return date.toISOString().slice(0, 10); }

export async function fetchSkyEvents() {
  const response = await fetch(sourceUrl, { headers: { 'user-agent': 'SportGuidaTV/0.2 contact' } });
  if (!response.ok) throw new Error(`Sky source HTTP ${response.status}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const events = [];
  $('article, li, .card, [class*=event], [class*=program]').each((_, element) => {
    const text = normalizeText($(element).text());
    if (!text || !/(serie\s*[abc]|formula\s*1|motogp|tennis|basket|volley)/i.test(text)) return;
    const time = text.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/)?.[0] || null;
    if (!time) return;
    const title = normalizeText($(element).find('h1,h2,h3,h4,a').first().text()) || text.slice(0, 160);
    events.push({ sport: 'calcio', competition: detectCompetition(text), date: dateIso(), time, title, channel: detectChannel(text), platform: 'Sky / NOW', live: true, source: 'Sky', sourceUrl });
  });
  return { sourceUrl, events: dedupe(events) };
}

function detectCompetition(text) {
  if (/serie\s*a/i.test(text)) return 'serie-a';
  if (/serie\s*b/i.test(text)) return 'serie-b';
  if (/serie\s*c/i.test(text)) return 'serie-c';
  return 'calcio';
}
function detectChannel(text) { return text.match(/Sky Sport[^|,.;]*/i)?.[0]?.trim() || 'Sky Sport'; }
function dedupe(events) { return [...new Map(events.map((event) => [`${event.date}|${event.time}|${event.title}|${event.channel}`, event])).values()]; }
