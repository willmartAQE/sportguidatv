import { Telegraf } from 'telegraf';
import { sportKeyboard, backKeyboard } from '../../src/bot/keyboard.js';
import { menuText, formatSchedule } from '../../src/bot/messages.js';
import { filterEvents } from '../../src/parser/events.js';
import { getCache } from '../../src/storage/cache.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && event.headers['x-telegram-bot-api-secret-token'] !== secret) return { statusCode: 401, body: 'Unauthorized' };
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
  try {
    await bot.handleUpdate(JSON.parse(event.body));
    return { statusCode: 200, body: 'OK' };
  } catch (error) {
    console.error('Telegram webhook error', error);
    return { statusCode: 500, body: 'Webhook error' };
  }
};