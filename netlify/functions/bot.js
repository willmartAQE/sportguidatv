import { Telegraf } from 'telegraf';
import { sportKeyboard, footballKeyboard, backKeyboard } from '../../src/bot/keyboard.js';
import { menuText, footballText, formatSchedule } from '../../src/bot/messages.js';
import { filterEvents } from '../../src/parser/events.js';
import { getCache } from '../../src/storage/cache.js';

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

const sportLabels = {
  tennis: 'Tennis',
  f1: 'Formula 1',
  motogp: 'MotoGP',
  basket: 'Basket',
  volley: 'Volley',
  equitazione: 'Equitazione'
};

function italyDate(offset = 0) {
  const romeDateStr = new Intl.DateTimeFormat('en-CA', { 
    timeZone: 'Europe/Rome', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).format(new Date());

  const [year, month, day] = romeDateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day + offset);

  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const incomingSecret = req.headers.get('x-telegram-bot-api-secret-token');
  if (secret && incomingSecret !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return new Response('Missing TELEGRAM_BOT_TOKEN', { status: 500 });
  }

  try {
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

    bot.start((ctx) => ctx.reply(menuText(), { parse_mode: 'HTML', reply_markup: sportKeyboard('today') }));

    bot.action(/^menu:sports(?::(today|tomorrow))?$/, async (ctx) => {
      await ctx.answerCbQuery();
      const day = ctx.match[1] || 'today';
      await safeEdit(ctx, day === 'tomorrow' ? '📅 <b>Domani</b>\n\nSeleziona uno sport:' : menuText(), { 
        parse_mode: 'HTML', 
        reply_markup: sportKeyboard(day) 
      });
    });

    bot.action(/^sport:(?!calcio)([a-z-]+):(today|tomorrow)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const sport = ctx.match[1];
      const day = ctx.match[2];
      const offset = day === 'tomorrow' ? 1 : 0;
      const cache = await getCache();
      const events = filterEvents(cache?.events || [], sport, null, italyDate(offset));
      await safeEdit(ctx, formatSchedule(sportLabels[sport] || sport, day, events), { 
        parse_mode: 'HTML', 
        reply_markup: backKeyboard(day) 
      });
    });

    bot.action(/^sport:calcio:(today|tomorrow)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const day = ctx.match[1];
      await safeEdit(ctx, footballText(), { parse_mode: 'HTML', reply_markup: footballKeyboard(day) });
    });

    bot.action(/^football:(serie-a|serie-b|serie-c):(today|tomorrow)$/, async (ctx) => {
      await ctx.answerCbQuery();
      const competition = ctx.match[1];
      const day = ctx.match[2];
      const offset = day === 'tomorrow' ? 1 : 0;
      const cache = await getCache();
      const events = filterEvents(cache?.events || [], 'calcio', competition, italyDate(offset));
      const label = competition.replace('serie-', 'Serie ').toUpperCase();
      await safeEdit(ctx, formatSchedule('Calcio', day, events, label), { 
        parse_mode: 'HTML', 
        reply_markup: backKeyboard(day) 
      });
    });

    bot.action('day:today', async (ctx) => {
      await ctx.answerCbQuery('Aggiornato');
      await safeEdit(ctx, menuText(), { parse_mode: 'HTML', reply_markup: sportKeyboard('today') });
    });

    bot.action('day:tomorrow', async (ctx) => {
      await ctx.answerCbQuery();
      await safeEdit(ctx, '📅 <b>Domani</b>\n\nSeleziona uno sport:', { 
        parse_mode: 'HTML', 
        reply_markup: sportKeyboard('tomorrow') 
      });
    });

    const body = await req.json();
    await bot.handleUpdate(body);

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Telegram webhook error:', error?.stack || error);
    return new Response('OK', { status: 200 });
  }
};
