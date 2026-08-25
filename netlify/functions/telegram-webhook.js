const cacheModule = require('../../src/storage/cache.js');
const keyboardModule = require('../../src/bot/keyboard.js');
const readCache = cacheModule.readCache || cacheModule.default?.readCache;
const CATEGORIES = keyboardModule.CATEGORIES || ['Equitazione', 'Formula 1', 'MotoGP', 'Sky Calcio', 'Tennis', 'Basket', 'Golf', 'Sport'];
const mainKeyboard = keyboardModule.mainKeyboard || (() => ({ reply_markup: { keyboard: CATEGORIES.map(category => [{ text: category }]), resize_keyboard: true } }));

const CATEGORY_RULES = {
  'Equitazione': event => /horse|equtv|equitaz|ippica|equestre/i.test(`${event.source || ''} ${event.channel || ''} ${event.title || ''}`),
  'Formula 1': event => /f1|formula ?1|formula one/i.test(`${event.channel || ''} ${event.title || ''}`),
  'MotoGP': event => /motogp|moto gp|motorsport|motociclismo/i.test(`${event.channel || ''} ${event.channel || ''} ${event.title || ''}`),
  'Sky Calcio': event => /calcio|football|soccer|serie ?[abc]|champions|europa league|conference league|premier league|la liga|bundesliga|ligue 1/i.test(`${event.channel || ''} ${event.title || ''}`),
  'Tennis': event => /tennis|supertennis/i.test(`${event.channel || ''} ${event.title || ''}`),
  'Basket': event => /basket|nba|eurolega/i.test(`${event.channel || ''} ${event.title || ''}`),
  'Golf': event => /golf/i.test(`${event.channel || ''} ${event.title || ''}`),
  'Sport': () => true
};

function eventsForCategory(events, category) {
  return events.filter(CATEGORY_RULES[category] || CATEGORY_RULES.Sport);
}

function formatEvents(events, category) {
  if (!events.length) return `📺 ${category}\n\nNessun evento trovato per oggi.`;
  return `📺 ${category}\n\n${events.map(event => `${event.startTime || '--:--'} — ${event.title}${event.channel ? ` (${event.channel})` : ''}`).join('\\n')}`;
}

async function answerTelegram(token, method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  return response.json();
}

exports.handler = async function handler(event) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { statusCode: 500, body: 'Missing TELEGRAM_BOT_TOKEN' };
  const update = JSON.parse(event.body || '{}');
  const message = update.message;
  const callback = update.callback_query;
  const chatId = message?.chat?.id || callback?.message?.chat?.id;
  if (!chatId) return { statusCode: 200, body: 'ok' };
  const cache = await readCache();
  const events = Array.isArray(cache) ? cache : (cache?.events || []);
  const selected = callback?.data?.startsWith('category:') ? callback.data.slice('category:'.length) : (message?.text === '/start' ? null : message?.text);
  if (selected && CATEGORIES.includes(selected)) {
    const filtered = eventsForCategory(events, selected);
    await answerTelegram(token, 'sendMessage', { chat_id: chatId, text: formatEvents(filtered, selected), reply_markup: mainKeyboard().reply_markup });
  } else {
    await answerTelegram(token, 'sendMessage', { chat_id: chatId, text: 'Scegli una categoria:', reply_markup: mainKeyboard().reply_markup });
  }
  if (callback?.id) await answerTelegram(token, 'answerCallbackQuery', { callback_query_id: callback.id });
  return { statusCode: 200, body: 'ok' };
};
