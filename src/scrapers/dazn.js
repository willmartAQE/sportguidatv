const sourceUrl = process.env.DAZN_SOURCE_URL || 'https://www.digital-news.it/palinsesti/dazn/dazn-calcio/';

export async function fetchDaznFootballEvents() {
  // TODO: implement a compliant parser after confirming page structure and reuse permissions.
  return { sourceUrl, events: [] };
}
