const CATEGORIES = ['calcio', 'tennis', 'f1', 'motogp', 'basket', 'volley', 'equitazione'];
const LABELS = { calcio: '⚽ Calcio', tennis: '🎾 Tennis', f1: '🏎 Formula 1', motogp: '🏍 MotoGP', basket: '🏀 Basket', volley: '🏐 Volley', equitazione: '🐎 Equitazione' };
const sportKeyboard = (day = 'today') => ({ inline_keyboard: [
  [{ text: '⚽ Calcio', callback_data: `sport:calcio:${day}` }, { text: '🎾 Tennis', callback_data: `sport:tennis:${day}` }],
  [{ text: '🏎 Formula 1', callback_data: `sport:f1:${day}` }, { text: '🏍 MotoGP', callback_data: `sport:motogp:${day}` }],
  [{ text: '🏀 Basket', callback_data: `sport:basket:${day}` }, { text: '🏐 Volley', callback_data: `sport:volley:${day}` }],
  [{ text: '🐎 Equitazione', callback_data: `sport:equitazione:${day}` }],
  [{ text: '📅 Domani', callback_data: 'day:tomorrow' }, { text: '🔄 Aggiorna', callback_data: 'day:today' }]
] });

const footballKeyboard = day => ({ inline_keyboard: [[{ text: '⬅️ Sport', callback_data: `menu:sports:${day}` }]] });

const SPORT_RULES = {
  calcio: /calcio|football|soccer|serie ?[abc]|champions|europa league|conference league|premier league|la liga|bundesliga|ligue 1/i,
  tennis: /tennis|supertennis/i,
  f1: /f1|formula ?1|formula one/i,
  motogp: /motogp|moto gp|motociclismo/i,
  basket: /basket|nba|eurolega/i,
  volley: /volley|pallavolo/i,
  equitazione: /horse|equitaz|ippica|equestre/i
};

async function loadCache() {
  try {
    const module = await import('../../src/storage/cache.js');
    const cache = module.getCache();
    return Array.isArray(cache?.events) ? cache.events : [];
  } catch (error) {
    console.error('Cache load error:', error);
    return [];
  }
}

function formatEvents(events, sport, day) {
  if (!events.length) return `${LABELS[sport]} — ${day === 'tomorrow' ? 'domani' : 'oggi'}\n\nNessun evento trovato.`;
  return `${LABELS[sport]} — ${day === 'tomorrow' ? 'domani' : 'oggi'}\n\n${events.map(event => `${event.startTime || event.time || '--:--'} — ${event.title || event.name || 'Evento'}${event.channel ? ` (${event.channel})` : ''}`).join('\n')}`;
}

async function telegram(token, method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`Telegram HTTP ${response.status}`);
  return response.json();
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') return { statusCode: 200, body: 'ok' };
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { statusCode: 500, body: 'Missing TELEGRAM_BOT_TOKEN' };
  let update;
  try { update = JSON.parse(event.body || '{}'); } catch { return { statusCode: 400, body: 'Invalid JSON' }; }
  const message = update.message;
  const callback = update.callback_query;
  const chatId = message?.chat?.id || callback?.message?.chat?.id;
  if (!chatId) return { statusCode: 200, body: 'ok' };
  const data = callback?.data || '';
  const text = message?.text?.trim() || '';
  let replyMarkup = sportKeyboard('today');
  let responseText = 'Scegli uno sport per vedere gli eventi di oggi su Sky:';
  const sportMatch = data.match(/^sport:([^:]+):(.+)$/);
  if (sportMatch && SPORT_RULES[sportMatch[1]]) {
    const sport = sportMatch[1];
    const day = sportMatch[2];
    const events = (await loadCache()).filter(eventItem => SPORT_RULES[sport].test(`${eventItem.source || ''} ${eventItem.channel || ''} ${eventItem.title || ''} ${eventItem.name || ''}`));
    responseText = formatEvents(events, sport, day);
    replyMarkup = footballKeyboard(day);
  } else if (data === 'day:tomorrow' || data === 'day:today' || data.startsWith('menu:sports:') || text === '/start' || text === '/menu') {
    replyMarkup = sportKeyboard(data === 'day:tomorrow' ? 'tomorrow' : 'today');
  }
  try {
    await telegram(token, 'sendMessage', { chat_id: chatId, text: responseText, reply_markup: replyMarkup });
    if (callback?.id) await telegram(token, 'answerCallbackQuery', { callback_query_id: callback.id });
  } catch (error) { console.error('Telegram send error:', error); }
  return { statusCode: 200, body: 'ok' };
}
