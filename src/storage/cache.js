import { connectLambda } from '@netlify/blobs';

export function configureBlobs(event) {
  connectLambda(event);
}

export async function getCache(event) {
  configureBlobs(event);
  const { getStore } = await import('@netlify/blobs');
  const store = getStore({ name: 'sport-schedule', consistency: 'strong' });
  return (await store.get('events', { type: 'json' })) || { updatedAt: null, events: [] };
}

export async function setCache(event, events) {
  configureBlobs(event);
  const { getStore } = await import('@netlify/blobs');
  const store = getStore({ name: 'sport-schedule', consistency: 'strong' });
  const value = { updatedAt: new Date().toISOString(), events };
  await store.setJSON('events', value);
  return value;
}
