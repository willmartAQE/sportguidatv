const SPORT_RULES = {
  calcio: /serie\s*[abc]|calcio/i,
  tennis: /tennis|atp|wta|sinner|alcaraz/i,
  f1: /formula\s*1|f1|gran premio/i,
  motogp: /motogp|moto\s*2|moto\s*3|superbike/i,
  basket: /basket|nba|eurolega|eurocup|lba/i,
  volley: /volley|pallavolo|cev|superlega/i
};

const FOOTBALL_RULES = {
  'serie-a': /serie\s*a/i,
  'serie-b': /serie\s*b/i,
  'serie-c': /serie\s*c/i
};

export function filterEvents(events, sport, competition = null, date = null) {
  const sportRule = SPORT_RULES[sport];
  const competitionRule = competition ? FOOTBALL_RULES[competition] : null;
  return events.filter((event) => {
    const text = `${event.title || ''} ${event.description || ''}`;
    return event.live !== false && (!date || event.date === date) && (!sportRule || sportRule.test(text)) && (!competitionRule || competitionRule.test(`${event.competition || ''} ${text}`));
  }).sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
}
