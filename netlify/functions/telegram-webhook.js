import { Telegraf } from 'telegraf';
import { sportKeyboard, footballKeyboard, backKeyboard } from '../../src/bot/keyboard.js';
import { menuText, footballText, formatSchedule } from '../../src/bot/messages.js';
import { filterEvents } from '../../src/parser/events.js';
import { getCache } from '../../src/storage/cache.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && event.headers['x-telegram-bot-api-secret-token'] !== secret) return { statusCode: 401, body: 'Unauthorized' };
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  bot.start((ctx) => ctx.reply(menuText(), { parse_mode: 'HTML', reply_markup: sportKeyboard() }));
  bot.action('menu:sports', async (ctx) => { await ctx.answerCbQuery(); await ctx.editMessageText(menuText(), { parse_mode: 'HTML', reply_markup: sportKeyboard() }); });
  bot.action('sport:calcio', async (ctx) => { await ctx.answerCbQuery(); await ctx.editMessageText(footballText(), { parse_mode: 'HTML', reply_markup: footballKeyboard() }); });
  bot.action(/^sport:(?!calcio)(.+)$/, async (ctx) => { await ctx.answerCbQuery(); const sport = ctx.match[1]; const cache = await getCache(); const events = filterEvents(cache.events, sport, null, new Date().toISOString().slice(0, 10)); await ctx.editMessageText(formatSchedule(sport, 'today', events), { parse_mode: 'HTML', reply_markup: backKeyboard() }); });
  bot.action(/^football:(serie-a|serie-b|serie-c)$/, async (ctx) => { await ctx.answerCbQuery(); const competition = ctx.match[1]; const cache = await getCache(); const events = filterEvents(cache.events, 'calcio', competition, new Date().toISOString().slice(0, 10)); const label = competition.replace('serie-', 'Serie ').toUpperCase(); await ctx.editMessageText(formatSchedule('Calcio', 'today', events, label), { parse_mode: 'HTML', reply_markup: backKeyboard() }); });
  bot.action('day:today', async (ctx) => { await ctx.answerCbQuery('Aggiornato'); await ctx.editMessageText(menuText(), { parse_mode: 'HTML', reply_markup: sportKeyboard() }); });
  bot.action('day:tomorrow', async (ctx) => { await ctx.answerCbQuery(); await ctx.editMessageText('📅 <b>Domani</b>\n\nSeleziona uno sport per vedere gli eventi disponibili.', { parse_mode: 'HTML', reply_markup: sportKeyboard() }); });
  try { await bot.handleUpdate(JSON.parse(event.body)); return { statusCode: 200, body: 'OK' }; } catch (error) { console.error('Telegram webhook error', error); return { statusCode: 500, body: 'Webhook error' }; }
};