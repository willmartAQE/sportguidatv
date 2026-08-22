export const menuText = () => '🏟 <b>Sport Guida TV</b>\n\nScegli uno sport per vedere gli eventi live di oggi su Sky:';

export const footballText = () => '⚽ <b>Calcio</b>\n\nScegli il campionato:';

export const formatSchedule = (sport, day, events, competition = null) => {
  const label = day === 'tomorrow' ? 'domani' : 'oggi';
  const heading = competition ? `${sport} — ${competition}` : sport;
  if (!events.length) return `📺 <b>${heading}</b>\n\nNessun evento live trovato per ${label}.`;
  return `📺 <b>${heading}</b> — ${label}\n\n${events.map((event) => `🕒 <b>${event.time}</b> — ${event.title}\n📡 ${event.channel}`).join('\n\n')}`;
};
