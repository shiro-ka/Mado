import type { Cookies } from "@sveltejs/kit";
import type { CloudflareStore, AppSession } from "./store.js";
import { customAlphabet } from "nanoid";

const SESSION_COOKIE = "mado_session";
const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Get the current session from the session cookie + KV.
 * Returns undefined if not authenticated.
 */
export async function getSession(
  cookies: Cookies,
  store: CloudflareStore
): Promise<AppSession | undefined> {
  const sessionId = cookies.get(SESSION_COOKIE);
  if (!sessionId) return undefined;
  return store.getSession(sessionId);
}

/**
 * Store a new session in KV and set the session cookie.
 * Returns the session ID.
 */
export async function createSession(
  cookies: Cookies,
  env: App.Platform["env"],
  store: CloudflareStore,
  session: AppSession
): Promise<string> {
  const nanoid = customAlphabet(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    32
  );
  const sessionId = nanoid();

  await store.setSession(sessionId, session, SESSION_TTL);

  const appUrl = env.APP_URL ?? "https://mado.blue";
  const isSecure = appUrl.startsWith("https://");

  cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    maxAge: SESSION_TTL,
    path: "/",
  });

  return sessionId;
}

/**
 * Clear the session cookie and delete from KV.
 */
export async function destroySession(
  cookies: Cookies,
  store: CloudflareStore
): Promise<void> {
  const sessionId = cookies.get(SESSION_COOKIE);
  if (sessionId) {
    await store.delSession(sessionId);
    cookies.delete(SESSION_COOKIE, { path: "/" });
  }
}

/**
 * Update profile fields in the current session without resetting the TTL.
 */
export async function updateSessionProfile(
  cookies: Cookies,
  store: CloudflareStore,
  did: string,
  profile: { handle: string; displayName?: string; avatar?: string }
): Promise<void> {
  const sessionId = cookies.get(SESSION_COOKIE);
  if (!sessionId) return;

  const session = await store.getSession(sessionId);
  if (!session || session.did !== did) return;

  const ttl = await store.sessionTtl(sessionId);
  const updated: AppSession = { ...session, ...profile };
  await store.setSession(sessionId, updated, ttl > 0 ? ttl : SESSION_TTL);
}
