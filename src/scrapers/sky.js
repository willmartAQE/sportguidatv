const sourceUrl = process.env.SKY_SOURCE_URL || 'https://programmi.sky.it/sport';

export async function fetchSkyEvents() {
  // TODO: implement a compliant parser for the official Sky programming pages.
  // This starter intentionally returns an empty list until selectors and reuse terms are verified.
  return { sourceUrl, events: [] };
}
