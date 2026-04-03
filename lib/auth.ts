import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getRedis, Keys, TTL } from "@/lib/redis";
import type { Session } from "@/types";

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

