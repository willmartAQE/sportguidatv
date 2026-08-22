import { Telegraf } from 'telegraf';
import { sportKeyboard, backKeyboard } from '../../src/bot/keyboard.js';
import { menuText, formatSchedule } from '../../src/bot/messages.js';
import { filterEvents } from '../../src/parser/events.js';
import { getCache } from '../../src/storage/cache.js';

export const config = { path: '/api/telegram-webhook' };

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) return new Response('Unauthorized', { status: 401 });
  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
  bot.start((ctx) => ctx.reply(menuText(), { parse_mode: 'HTML', reply_markup: sportKeyboard() }));
  bot.action('menu:sports', async (ctx) => { await ctx.answerCbQuery(); await ctx.editMessageText(menuText(), { parse_mode: 'HTML', reply_markup: sportKeyboard() }); });
  bot.action(/^sport:(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const sport = ctx.match[1];
    const events = filterEvents(getCache().events, sport);
    await ctx.editMessageText(formatSchedule(sport, 'today', events), { parse_mode: 'HTML', reply_markup: backKeyboard() });
  });
  bot.action('day:today', async (ctx) => { await ctx.answerCbQuery('Aggiornato'); await ctx.editMessageText(menuText(), { parse_mode: 'HTML', reply_markup: sportKeyboard() }); });
  bot.action('day:tomorrow', async (ctx) => { await ctx.answerCbQuery(); await ctx.editMessageText('📅 <b>Domani</b>\n\nSeleziona uno sport per vedere gli eventi disponibili.', { parse_mode: 'HTML', reply_markup: sportKeyboard() }); });
  await bot.handleUpdate(await req.json());
  return new Response('OK');
};