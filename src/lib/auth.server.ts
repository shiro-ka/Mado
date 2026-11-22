import type { Cookies } from "@sveltejs/kit";
import type { CloudflareStore, AppSession, SessionEntry } from "./store.js";
import { getProfile } from "./atproto/index.js";
import { customAlphabet } from "nanoid";
import { MAX_ACCOUNTS, type AccountSummary } from "./accounts.js";
import { endDeviceSession } from "./oauth.server.js";
import { appOrigin } from "./api.server.js";

const SESSION_COOKIE = "mado_session";
const ACCOUNTS_COOKIE = "mado_accounts";
const SESSION_TTL = 30 * 24 * 60 * 60;

export async function getSessionEntry(
  cookies: Cookies,
  store: CloudflareStore
): Promise<SessionEntry | undefined> {
  const sessionId = cookies.get(SESSION_COOKIE);
  if (!sessionId) return undefined;
  const entry = await store.getSessionEntry(sessionId);
  if (!entry) return undefined;
  const { session } = entry;
  if (!session.deviceKey) {
    await store.delSession(sessionId);
    cookies.delete(SESSION_COOKIE, { path: "/" });
    return undefined;
  }
  if (
    !(await store.hasOAuthSession(store.oauthSessionKey(session.deviceKey, session.did)))
  ) {
    await store.delSession(sessionId);
    cookies.delete(SESSION_COOKIE, { path: "/" });
    return undefined;
  }
  return entry;
}

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

  const others: string[] = [];
  for (const id of knownAccountIds(cookies)) {
    const existing = await store.getSession(id);
    if (!existing) continue;
    if (existing.did === session.did) {
      if (existing.deviceKey) await endDeviceSession(env, store, existing.did, existing.deviceKey);
      await store.delSession(id);
      continue;
    }
    others.push(id);
  }
  const kept = others.slice(0, MAX_ACCOUNTS - 1);
  for (const id of others.slice(MAX_ACCOUNTS - 1)) await store.delSession(id);

  setSessionCookie(cookies, env, sessionId);
  setAccountIds(cookies, env, [sessionId, ...kept]);

  return sessionId;
}

function knownAccountIds(cookies: Cookies): string[] {
  const ids = (cookies.get(ACCOUNTS_COOKIE) ?? "").split(".").filter((id) => /^[A-Za-z0-9]{32}$/.test(id));
  const active = cookies.get(SESSION_COOKIE);
  if (active && !ids.includes(active)) ids.unshift(active);
  return ids;
}

function setAccountIds(cookies: Cookies, env: App.Platform["env"], ids: string[]): void {
  if (ids.length === 0) {
    cookies.delete(ACCOUNTS_COOKIE, { path: "/" });
    return;
  }
  const appUrl = appOrigin(env);
  cookies.set(ACCOUNTS_COOKIE, ids.join("."), {
    httpOnly: true,
    secure: appUrl.startsWith("https://"),
    sameSite: "lax",
    maxAge: SESSION_TTL,
    path: "/",
  });
}

export async function listAccounts(
  cookies: Cookies,
  env: App.Platform["env"],
  store: CloudflareStore,
  current?: AppSession
): Promise<AccountSummary[]> {
  const active = cookies.get(SESSION_COOKIE);
  const ids = knownAccountIds(cookies);
  const sessions = await Promise.all(
    ids.map((id) => (id === active && current ? current : store.getSession(id)))
  );
  const accounts: AccountSummary[] = [];
  const valid: string[] = [];
  for (const [i, id] of ids.entries()) {
    const session = sessions[i];
    if (!session) continue;
    valid.push(id);
    accounts.push({
      did: session.did,
      handle: session.handle,
      displayName: session.displayName,
      avatar: session.avatar,
      active: id === active,
    });
  }
  if (valid.length !== ids.length) setAccountIds(cookies, env, valid);
  return accounts;
}

export async function switchAccount(
  cookies: Cookies,
  env: App.Platform["env"],
  store: CloudflareStore,
  did: string
): Promise<boolean> {
  for (const id of knownAccountIds(cookies)) {
    const session = await store.getSession(id);
    if (session?.did === did) {
      setSessionCookie(cookies, env, id);
      return true;
    }
  }
  return false;
}

function setSessionCookie(cookies: Cookies, env: App.Platform["env"], sessionId: string): void {
  const appUrl = appOrigin(env);
  cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: appUrl.startsWith("https://"),
    sameSite: "lax",
    maxAge: SESSION_TTL,
    path: "/",
  });
}

const SESSION_RENEW_AFTER = 24 * 60 * 60;

export async function renewSession(
  cookies: Cookies,
  env: App.Platform["env"],
  store: CloudflareStore,
  entry: SessionEntry
): Promise<AppSession> {
  const sessionId = cookies.get(SESSION_COOKIE);
  if (!sessionId) return entry.session;
  const remaining = entry.expiresAt === null ? 0 : entry.expiresAt - Math.floor(Date.now() / 1000);
  if (remaining > SESSION_TTL - SESSION_RENEW_AFTER) return entry.session;
  const profile = await getProfile(entry.session.did);
  const session: AppSession = profile
    ? {
        ...entry.session,
        handle: profile.handle,
        displayName: profile.displayName || undefined,
        avatar: profile.avatar || undefined,
      }
    : entry.session;
  await store.setSession(sessionId, session, SESSION_TTL);
  setSessionCookie(cookies, env, sessionId);
  setAccountIds(cookies, env, knownAccountIds(cookies));
  return session;
}

export async function destroySession(
  cookies: Cookies,
  env: App.Platform["env"],
  store: CloudflareStore
): Promise<boolean> {
  const sessionId = cookies.get(SESSION_COOKIE);
  const rest = knownAccountIds(cookies).filter((id) => id !== sessionId);
  if (sessionId) await store.delSession(sessionId);
  for (const id of rest) {
    if (await store.getSession(id)) {
      setSessionCookie(cookies, env, id);
      setAccountIds(cookies, env, rest);
      return true;
    }
  }
  cookies.delete(SESSION_COOKIE, { path: "/" });
  setAccountIds(cookies, env, []);
  return false;
}
