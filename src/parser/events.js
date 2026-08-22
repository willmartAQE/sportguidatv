const SPORT_RULES = {
  calcio: /serie\s*[abc]|calcio|champions|europa league/i,
  tennis: /tennis|atp|wta|sinner|alcaraz/i,
  f1: /formula\s*1|f1|gran premio/i,
  motogp: /motogp|moto\s*2|moto\s*3|superbike/i,
  basket: /basket|nba|eurolega|eurocup|lba/i,
  volley: /volley|pallavolo|cev|superlega/i
};

const FOOTBALL_RULES = {
  'serie-a': /serie\s*a|serie a enilive/i,
  'serie-b': /serie\s*b|serie bkt/i,
  'serie-c': /serie\s*c|serie c sky/i
};

export function filterEvents(events, sport, competition = null) {
  const sportRule = SPORT_RULES[sport];
  const competitionRule = competition ? FOOTBALL_RULES[competition] : null;
  return events.filter((event) => {
    const text = `${event.title || ''} ${event.description || ''}`;
    const sportMatches = !sportRule || sportRule.test(text);
    const competitionMatches = !competitionRule || competitionRule.test(text);
    return event.live !== false && sportMatches && competitionMatches;
  });
}
