export const menuText = () => '🏟 <b>Sport Guida TV</b>\n\nScegli uno sport per vedere gli eventi live di oggi su Sky:';

export const formatSchedule = (sport, day, events) => {
  const label = day === 'tomorrow' ? 'domani' : 'oggi';
  if (!events.length) return `📺 <b>${sport}</b>\n\nNessun evento live trovato per ${label}.`;
  return `📺 <b>${sport}</b> — ${label}\n\n${events.map((event) => `🕒 <b>${event.time}</b> — ${event.title}\n📡 ${event.channel}`).join('\n\n')}`;
};