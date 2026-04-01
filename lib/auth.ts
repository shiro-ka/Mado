import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRedis, Keys, TTL } from "@/lib/redis";
import type { Session, StoredTokens } from "@/types";

const SESSION_COOKIE = "mado_session";

/**
 * Get the current session from the session cookie + Redis.
 * Returns null if not authenticated.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionId) return null;

    const redis = getRedis();
    const session = await redis.get<Session>(Keys.session(sessionId));
    return session;
  } catch {
    return null;
  }
}

/**
 * Get the current session, redirecting to login if not authenticated.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }
  return session;
}

/**
 * Store a new session in Redis and set the session cookie.
 * Returns the session ID.
 */
export async function createSession(session: Session): Promise<string> {
  const { customAlphabet } = await import("nanoid");
  const nanoid = customAlphabet(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    32
  );
  const sessionId = nanoid();

  const redis = getRedis();
  await redis.setex(Keys.session(sessionId), TTL.SESSION, session);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TTL.SESSION,
    path: "/",
  });

  return sessionId;
}

/**
 * Clear the session cookie and delete from Redis.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    const redis = getRedis();
    await redis.del(Keys.session(sessionId));
    cookieStore.delete(SESSION_COOKIE);
  }
}

/**
 * Store OAuth tokens for a user DID.
 */
export async function storeTokens(
  did: string,
  tokens: StoredTokens
): Promise<void> {
  const redis = getRedis();
  await redis.setex(Keys.token(did), TTL.TOKEN, tokens);
}

/**
 * Retrieve stored OAuth tokens for a user DID.
 */
export async function getTokens(did: string): Promise<StoredTokens | null> {
  const redis = getRedis();
  return redis.get<StoredTokens>(Keys.token(did));
}

/**
 * Check if the stored tokens are expiring soon (within 30 days)
 * and refresh them if needed.
 * Returns updated tokens or null if refresh failed.
 */
export async function refreshTokensIfNeeded(
  did: string
): Promise<StoredTokens | null> {
  const tokens = await getTokens(did);
  if (!tokens) return null;

  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const expiresAt = tokens.expiresAt;
  const needsRefresh = expiresAt - Date.now() < thirtyDaysMs;

  if (!needsRefresh) return tokens;

  // TODO: Implement actual token refresh using @atproto/oauth-client-node
  // For now, return existing tokens
  return tokens;
}

/**
 * Check if the user's token is expiring within the given number of days.
 */
export function isTokenExpiringSoon(
  tokens: StoredTokens,
  withinDays: number = 30
): boolean {
  const ms = withinDays * 24 * 60 * 60 * 1000;
  return tokens.expiresAt - Date.now() < ms;
}
