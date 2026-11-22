import { timed } from "./timing.server.js";

const ORIGIN = "https://cache.mado.internal/";

function edgeCache(): Cache | null {
  return (globalThis.caches as unknown as { default?: Cache } | undefined)?.default ?? null;
}

function keyUrl(key: string) {
  return ORIGIN + encodeURIComponent(key);
}

export async function edgeGet(key: string): Promise<string | null> {
  const cache = edgeCache();
  if (!cache) return null;
  try {
    const res = await timed("cache", "edge", `match ${key.split(":")[0]}`, () => cache.match(keyUrl(key)));
    return res ? await res.text() : null;
  } catch {
    return null;
  }
}

export async function edgePut(key: string, value: string, ttlSeconds: number): Promise<void> {
  const cache = edgeCache();
  if (!cache) return;
  try {
    await timed("cache", "edge", `put ${key.split(":")[0]}`, () =>
      cache.put(keyUrl(key), new Response(value, { headers: { "cache-control": `max-age=${ttlSeconds}` } })),
    );
  } catch {
    return;
  }
}
