const SPORT_RULES = {
  calcio: /serie\s*[abc]|calcio|champions|europa league/i,
  tennis: /tennis|atp|wta|sinner|alcaraz/i,
  f1: /formula\s*1|f1|gran premio/i,
  motogp: /motogp|moto\s*2|moto\s*3|superbike/i,
  basket: /basket|nba|eurolega|eurocup|lba/i,
  volley: /volley|pallavolo|cev|superlega/i
};

export function filterEvents(events, sport) {
  const rule = SPORT_RULES[sport];
  return events.filter((event) => event.live !== false && (!rule || rule.test(`${event.title} ${event.description || ''}`)));
}
