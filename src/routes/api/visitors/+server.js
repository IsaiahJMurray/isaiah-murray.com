// Unique-visitor count for the footer.
//
// Each browser keeps a random id in localStorage and POSTs it once per page load. Ids go into a
// Redis HyperLogLog (PFADD / PFCOUNT): it counts distinct values in ~12 KB with about 1% error
// and never stores the ids themselves. No IP addresses or cookies are kept.
//
// Storage is an Upstash Redis database over its REST API. Set either pair of env vars on Vercel:
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN   (Upstash console)
//   KV_REST_API_URL        + KV_REST_API_TOKEN          (Vercel Marketplace "Upstash for Redis")
// Without them the route answers { count: null } and the footer shows nothing, except under
// `npm run dev`, where an in-memory set stands in so the footer can be seen working.
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';

const KEY = 'visitors:hll';
const ID = /^[A-Za-z0-9-]{16,64}$/;
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor/i;
const devIds = new Set();

// Runs Redis commands in one round trip; null when no database is configured.
async function redis(...commands) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands)
  });
  if (!res.ok) throw new Error(`Redis responded ${res.status}`);
  return (await res.json()).map((r) => r.result);
}

async function count(id) {
  const results = id ? await redis(['PFADD', KEY, id], ['PFCOUNT', KEY]) : await redis(['PFCOUNT', KEY]);
  if (results) return results[results.length - 1];
  if (!dev) return null;
  if (id) devIds.add(id);
  return devIds.size;
}

const reply = (n) => json({ count: typeof n === 'number' ? n : null }, { headers: { 'Cache-Control': 'no-store' } });

export async function GET() {
  try { return reply(await count(null)); } catch { return reply(null); }
}

export async function POST({ request }) {
  try {
    const { id } = await request.json().catch(() => ({}));
    // Crawlers and malformed ids are not counted, but still get the number.
    const counted = typeof id === 'string' && ID.test(id) && !BOT.test(request.headers.get('user-agent') || '');
    return reply(await count(counted ? id : null));
  } catch {
    return reply(null);
  }
}
