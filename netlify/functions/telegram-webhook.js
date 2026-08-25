const fs = require('fs/promises');
const path = require('path');

const CATEGORIES = ['Equitazione', 'Formula 1', 'MotoGP', 'Sky Calcio', 'Tennis', 'Basket', 'Golf', 'Sport'];
const CATEGORY_RULES = {
  'Equitazione': /horse|equtv|equitaz|ippica|equestre/i,
  'Formula 1': /f1|formula ?1|formula one/i,
  'MotoGP': /motogp|moto gp|motorsport|motociclismo/i,
  'Sky Calcio': /calcio|football|soccer|serie ?[abc]|champions|europa league|conference league|premier league|la liga|bundesliga|ligue 1/i,
  'Tennis': /tennis|supertennis/i,
  'Basket': /basket|nba|eurolega/i,
  'Golf': /golf/i,
  'Sport': /.*/i
};

function keyboard() {
  return { inline_keyboard: CATEGORIES.map(category => [{ text: category, callback_data: `category:${category}` }]) };
}

async function readEvents() {
  const candidates = [
    path.join(process.cwd(), 'events.json'),
    path.join(process.cwd(), 'data', 'events.json'),
    path.join(process.cwd(), 'src', 'storage', 'events.json')
  ];
  for (const file of candidates) {
    try {
      const value = JSON.parse(await fs.readFile(file, 'utf8'));
      return Array.isArray(value) ? value : (value.events || []);
    } catch (_) {}
  }
  return [];
}

function formatEvents(events, category) {
  if (!events.length) return `📺 ${category}\n\nNessun evento trovato per oggi.`;
  return `📺 ${category}\n\n${events.map(event => `${event.startTime || '--:--'} — ${event.title || 'Evento'}${event.channel ? ` (${event.channel})` : ''}`).join('\n')}`;
}

async function telegram(token, method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
  return response.json();
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 200, body: 'ok' };
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { statusCode: 500, body: 'Missing TELEGRAM_BOT_TOKEN' };
  let update;
  try { update = JSON.parse(event.body || '{}'); } catch (_) { return { statusCode: 400, body: 'Invalid JSON' }; }
  const message = update.message;
  const callback = update.callback_query;
  const chatId = message?.chat?.id || callback?.message?.chat?.id;
  if (!chatId) return { statusCode: 200, body: 'ok' };
  const events = await readEvents();
  const selected = callback?.data?.startsWith('category:') ? callback.data.slice(9) : null;
  if (selected && CATEGORIES.includes(selected)) {
    const rule = CATEGORY_RULES[selected];
    const filtered = events.filter(event => rule.test(`${event.source || ''} ${event.channel || ''} ${event.title || ''}`));
    await telegram(token, 'sendMessage', { chat_id: chatId, text: formatEvents(filtered, selected), reply_markup: keyboard() });
    if (callback.id) await telegram(token, 'answerCallbackQuery', { callback_query_id: callback.id });
  } else {
    await telegram(token, 'sendMessage', { chat_id: chatId, text: 'Scegli uno sport per vedere gli eventi di oggi su Sky:', reply_markup: keyboard() });
  }
  return { statusCode: 200, body: 'ok' };
};
