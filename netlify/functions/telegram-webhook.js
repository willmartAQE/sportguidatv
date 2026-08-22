import { Telegraf } from 'telegraf';
import { sportKeyboard, footballKeyboard, backKeyboard } from '../../src/bot/keyboard.js';
import { menuText, footballText, formatSchedule } from '../../src/bot/messages.js';
import { filterEvents } from '../../src/parser/events.js';
import { getCache } from '../../src/storage/cache.js';

function headerValue(headers = {}, name) {
  const key = Object.keys(headers).find((item) => item.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : undefined;
}

function isMessageNotModified(error) {
  return error?.description?.includes('message is not modified') || error?.message?.includes('message is not modified');
}

async function safeEdit(ctx, text, extra) {
  try {
    await ctx.editMessageText(text, extra);
  } catch (error) {
    if (!isMessageNotModified(error)) throw error;
  }
}

const sportLabels = { tennis: 'Tennis', f1: 'Formula 1', motogp: 'MotoGP', basket: 'Basket', volley: 'Volley', equitazione: 'Equitazione' };
const italyDate = (offset = 0) => { const date = new Date(); date.setDate(date.getDate() + offset); return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(date); };

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && headerValue(event.headers, 'x-telegram-bot-api-secret-token') !== secret) return { statusCode: 401, body: 'Unauthorized' };
  if (!process.env.TELEGRAM_BOT_TOKEN) return { statusCode: 500, body: 'Missing TELEGRAM_BOT_TOKEN' };
  try {
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    bot.start((ctx) => ctx.reply(menuText(), { parse_mode: 'HTML', reply_markup: sportKeyboard('today') }));
    bot.action(/^menu:sports(?::(today|tomorrow))?$/, async (ctx) => { await ctx.answerCbQuery(); const day = ctx.match[1] || 'today'; await safeEdit(ctx, day === 'tomorrow' ? '📅 <b>Domani</b>\n\nSeleziona uno sport:' : menuText(), { parse_mode: 'HTML', reply_markup: sportKeyboard(day) }); });
    bot.action(/^sport:(?!calcio)([a-z-]+):(today|tomorrow)$/, async (ctx) => { await ctx.answerCbQuery(); const sport = ctx.match[1]; const day = ctx.match[2]; const offset = day === 'tomorrow' ? 1 : 0; const cache = await getCache(); const events = filterEvents(cache.events, sport, null, italyDate(offset)); await safeEdit(ctx, formatSchedule(sportLabels[sport] || sport, day, events), { parse_mode: 'HTML', reply_markup: backKeyboard(day) }); });
    bot.action(/^sport:calcio:(today|tomorrow)$/, async (ctx) => { await ctx.answerCbQuery(); const day = ctx.match[1]; await safeEdit(ctx, footballText(), { parse_mode: 'HTML', reply_markup: footballKeyboard(day) }); });
    bot.action(/^football:(serie-a|serie-b|serie-c):(today|tomorrow)$/, async (ctx) => { await ctx.answerCbQuery(); const competition = ctx.match[1]; const day = ctx.match[2]; const offset = day === 'tomorrow' ? 1 : 0; const cache = await getCache(); const events = filterEvents(cache.events, 'calcio', competition, italyDate(offset)); const label = competition.replace('serie-', 'Serie ').toUpperCase(); await safeEdit(ctx, formatSchedule('Calcio', day, events, label), { parse_mode: 'HTML', reply_markup: backKeyboard(day) }); });
    bot.action('day:today', async (ctx) => { await ctx.answerCbQuery('Aggiornato'); await safeEdit(ctx, menuText(), { parse_mode: 'HTML', reply_markup: sportKeyboard('today') }); });
    bot.action('day:tomorrow', async (ctx) => { await ctx.answerCbQuery(); await safeEdit(ctx, '📅 <b>Domani</b>\n\nSeleziona uno sport:', { parse_mode: 'HTML', reply_markup: sportKeyboard('tomorrow') }); });
    await bot.handleUpdate(JSON.parse(event.body || '{}'));
    return { statusCode: 200, headers: { 'content-type': 'text/plain; charset=utf-8' }, body: 'OK' };
  } catch (error) {
    console.error('Telegram webhook error:', error?.stack || error);
    return { statusCode: 200, body: 'OK' };
  }
};
