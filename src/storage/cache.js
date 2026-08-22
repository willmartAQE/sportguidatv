import { getStore } from '@netlify/blobs';

const store = () => getStore({ name: 'sport-schedule', consistency: 'strong' });

export async function getCache() { return (await store().get('events', { type: 'json' })) || { updatedAt: null, events: [] }; }
export async function setCache(events) { const value = { updatedAt: new Date().toISOString(), events }; await store().setJSON('events', value); return value; }
