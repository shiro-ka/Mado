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

  const others: AccountEntry[] = [];
  const unreadable: AccountEntry[] = [];
  for (const entry of readAccounts(cookies)) {
    const existing = await store.getSession(entry.id);
    if (!existing) {
      const kept = keepUnreadable(entry);
      if (kept) unreadable.push(kept);
      continue;
    }
    if (existing.did === session.did) {
      if (existing.deviceKey) await endDeviceSession(env, store, existing.did, existing.deviceKey);
      await store.delSession(entry.id);
      continue;
    }
    others.push({ id: entry.id });
  }
  const kept = others.slice(0, MAX_ACCOUNTS - 1);
  for (const entry of others.slice(MAX_ACCOUNTS - 1)) await store.delSession(entry.id);

  setSessionCookie(cookies, env, sessionId);
  writeAccounts(cookies, env, [{ id: sessionId }, ...kept, ...unreadable]);

  return sessionId;
}

type AccountEntry = { id: string; unreadableSince?: number };

const UNREADABLE_GRACE_SECONDS = 600;

function readAccounts(cookies: Cookies): AccountEntry[] {
  const entries: AccountEntry[] = [];
  for (const part of (cookies.get(ACCOUNTS_COOKIE) ?? "").split(".")) {
    const m = /^([A-Za-z0-9]{32})(?:~(\d+))?$/.exec(part);
    if (m) entries.push(m[2] ? { id: m[1], unreadableSince: Number(m[2]) } : { id: m[1] });
  }
  const active = cookies.get(SESSION_COOKIE);
  if (active && !entries.some((e) => e.id === active)) entries.unshift({ id: active });
  return entries;
}

function knownAccountIds(cookies: Cookies): string[] {
  return readAccounts(cookies).map((e) => e.id);
}

function keepUnreadable(entry: AccountEntry): AccountEntry | null {
  const now = Math.floor(Date.now() / 1000);
  if (entry.unreadableSince === undefined) return { id: entry.id, unreadableSince: now };
  return now - entry.unreadableSince < UNREADABLE_GRACE_SECONDS ? entry : null;
}

function writeAccounts(cookies: Cookies, env: App.Platform["env"], entries: AccountEntry[]): void {
  if (entries.length === 0) {
    cookies.delete(ACCOUNTS_COOKIE, { path: "/" });
    return;
  }
  const value = entries.map((e) => (e.unreadableSince === undefined ? e.id : `${e.id}~${e.unreadableSince}`)).join(".");
  const appUrl = appOrigin(env);
  cookies.set(ACCOUNTS_COOKIE, value, {
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
  const entries = readAccounts(cookies);
  const sessions = await Promise.all(
    entries.map((e) => (e.id === active && current ? current : store.getSession(e.id)))
  );
  const accounts: AccountSummary[] = [];
  const next: AccountEntry[] = [];
  for (const [i, entry] of entries.entries()) {
    const session = sessions[i];
    if (!session) {
      const kept = keepUnreadable(entry);
      if (kept) next.push(kept);
      continue;
    }
    next.push({ id: entry.id });
    accounts.push({
      did: session.did,
      handle: session.handle,
      displayName: session.displayName,
      avatar: session.avatar,
      active: entry.id === active,
    });
  }
  const changed =
    next.length !== entries.length ||
    next.some((e, i) => e.id !== entries[i].id || e.unreadableSince !== entries[i].unreadableSince);
  if (changed) writeAccounts(cookies, env, next);
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
  try {
    await store.setSession(sessionId, session, SESSION_TTL);
  } catch (err) {
    console.error("[renewSession]", err);
    return entry.session;
  }
  setSessionCookie(cookies, env, sessionId);
  writeAccounts(cookies, env, readAccounts(cookies));
  return session;
}

export async function destroySession(
  cookies: Cookies,
  env: App.Platform["env"],
  store: CloudflareStore
): Promise<boolean> {
  const sessionId = cookies.get(SESSION_COOKIE);
  const rest = readAccounts(cookies).filter((e) => e.id !== sessionId);
  if (sessionId) await store.delSession(sessionId);
  for (const entry of rest) {
    if (await store.getSession(entry.id)) {
      setSessionCookie(cookies, env, entry.id);
      writeAccounts(cookies, env, rest);
      return true;
    }
  }
  cookies.delete(SESSION_COOKIE, { path: "/" });
  writeAccounts(cookies, env, []);
  return false;
}
