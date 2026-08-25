const fs = require('fs/promises');
const path = require('path');

const CATEGORIES = ['Equitazione', 'Formula 1', 'MotoGP', 'Sky Calcio', 'Tennis', 'Basket', 'Golf', 'Sport'];
const RULES = {
  'Equitazione': /horse|equtv|equitaz|ippica|equestre/i,
  'Formula 1': /f1|formula ?1|formula one/i,
  'MotoGP': /motogp|moto gp|motorsport|motociclismo/i,
  'Sky Calcio': /calcio|football|soccer|serie ?[abc]|champions|europa league|conference league|premier league|la liga|bundesliga|ligue 1/i,
  'Tennis': /tennis|supertennis/i,
  'Basket': /basket|nba|eurolega/i,
  'Golf': /golf/i,
  'Sport': /.*/i
};

const keyboard = () => ({ inline_keyboard: CATEGORIES.map(category => [{ text: category, callback_data: `category:${category}` }]) });

async function readEvents() {
  for (const file of [path.join(process.cwd(), 'events.json'), path.join(process.cwd(), 'data', 'events.json'), path.join(process.cwd(), 'src', 'storage', 'events.json')]) {
    try { const value = JSON.parse(await fs.readFile(file, 'utf8')); return Array.isArray(value) ? value : (value.events || []); } catch (_) {}
  }
  return [];
}

async function telegram(token, method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
  return response.json();
}

function formatEvents(events, category) {
  if (!events.length) return `📺 ${category}\n\nNessun evento trovato per oggi.`;
  return `📺 ${category}\n\n${events.map(item => `${item.startTime || '--:--'} — ${item.title || 'Evento'}${item.channel ? ` (${item.channel})` : ''}`).join('\n')}`;
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return { statusCode: 200, body: 'ok' };
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { statusCode: 500, body: 'Missing TELEGRAM_BOT_TOKEN' };
  let update;
  try { update = JSON.parse(event.body || '{}'); } catch (_) { return { statusCode: 400, body: 'Invalid JSON' }; }
  const message = update.message;
  const callback = update.callback_query;
  const chatId = message?.chat?.id || callback?.message?.chat?.id;
  if (!chatId) return { statusCode: 200, body: 'ok' };
  try {
    const events = await readEvents();
    const callbackCategory = callback?.data?.startsWith('category:') ? callback.data.slice(9) : null;
    const text = message?.text?.trim() || '';
    const category = callbackCategory || CATEGORIES.find(item => item.toLowerCase() === text.toLowerCase());
    const selected = category && RULES[category] ? events.filter(item => RULES[category].test(`${item.source || ''} ${item.channel || ''} ${item.title || ''}`)) : [];
    await telegram(token, 'sendMessage', { chat_id: chatId, text: category ? formatEvents(selected, category) : 'Scegli uno sport per vedere gli eventi di oggi su Sky:', reply_markup: keyboard() });
    if (callback?.id) await telegram(token, 'answerCallbackQuery', { callback_query_id: callback.id });
  } catch (error) { console.error(error); }
  return { statusCode: 200, body: 'ok' };
};
