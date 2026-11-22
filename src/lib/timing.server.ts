import { AsyncLocalStorage } from "node:async_hooks";

type Env = App.Platform["env"];
type KVNamespace = Env["MADO_SESSION"];
type D1Database = Env["DB"];
type D1PreparedStatement = ReturnType<D1Database["prepare"]>;

type Entry = { kind: "fetch" | "d1" | "kv" | "cache"; target: string; op: string; at: number; ms: number; ok: boolean };
type Trace = { start: number; entries: Entry[]; logged: boolean; label: string };

const als = new AsyncLocalStorage<Trace>();

export function timingEnabled(env: Env | undefined) {
  return env?.MADO_TIMING === "1";
}

export async function timed<T>(kind: Entry["kind"], target: string, op: string, run: () => Promise<T>): Promise<T> {
  const trace = als.getStore();
  if (!trace) return run();
  const t0 = Date.now();
  let ok = true;
  try {
    return await run();
  } catch (err) {
    ok = false;
    throw err;
  } finally {
    const entry: Entry = { kind, target, op, at: t0 - trace.start, ms: Date.now() - t0, ok };
    if (trace.logged) console.log(JSON.stringify({ timing_late: trace.label, entry: row(entry) }));
    else trace.entries.push(entry);
  }
}

function row(e: Entry) {
  return [e.kind, e.target, e.op, e.at, e.ms, e.ok ? "ok" : "fail"];
}

let fetchWrapped = false;

export function wrapGlobalFetch() {
  if (fetchWrapped) return;
  fetchWrapped = true;
  const original = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (!als.getStore()) return original(input, init);
    const url = new URL(input instanceof Request ? input.url : String(input));
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    const collection = url.searchParams.get("collection");
    const detail = [collection, url.searchParams.has("cursor") ? "cursor" : null].filter(Boolean).join(" ");
    const op = `${method} ${url.pathname}${detail ? ` (${detail})` : ""}`;
    return timed("fetch", url.host, op, () => original(input, init));
  }) as typeof fetch;
}

const KV_METHODS = new Set(["get", "getWithMetadata", "put", "delete", "list"]);

function wrapKv(name: string, kv: KVNamespace): KVNamespace {
  return new Proxy(kv, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof prop !== "string" || !KV_METHODS.has(prop) || typeof value !== "function") return value;
      return (...args: unknown[]) => timed("kv", name, prop, () => value.apply(target, args));
    },
  });
}

function sqlLabel(sql: string) {
  const s = sql.replace(/\s+/g, " ").trim();
  const verb = s.split(" ")[0]?.toUpperCase() ?? "?";
  const table = /\b(?:FROM|INTO|UPDATE|JOIN)\s+([A-Za-z_][A-Za-z0-9_]*)/i.exec(s)?.[1] ?? "?";
  return `${verb} ${table}`;
}

const STMT_METHODS = new Set(["first", "all", "run", "raw"]);

function wrapStmt(stmt: D1PreparedStatement, label: string): D1PreparedStatement {
  return new Proxy(stmt, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      if (prop === "bind") return (...args: unknown[]) => wrapStmt(value.apply(target, args), label);
      if (typeof prop === "string" && STMT_METHODS.has(prop))
        return (...args: unknown[]) => timed("d1", "DB", `${prop} ${label}`, () => value.apply(target, args));
      return value.bind(target);
    },
  });
}

function wrapD1(db: D1Database): D1Database {
  return new Proxy(db, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;
      if (prop === "prepare") return (sql: string) => wrapStmt(value.call(target, sql), sqlLabel(sql));
      if (prop === "batch")
        return (stmts: D1PreparedStatement[]) =>
          timed("d1", "DB", `batch ${stmts.length}`, () => value.call(target, stmts));
      if (prop === "exec") return (sql: string) => timed("d1", "DB", `exec ${sqlLabel(sql)}`, () => value.call(target, sql));
      return value.bind(target);
    },
  });
}

export function wrapEnv(env: Env): Env {
  const wrapped: Record<string, unknown> = { ...env };
  for (const [key, value] of Object.entries(env)) {
    if (key === "DB") wrapped[key] = wrapD1(value as D1Database);
    else if (value && typeof value === "object" && "getWithMetadata" in value) wrapped[key] = wrapKv(key, value as KVNamespace);
  }
  return wrapped as Env;
}

let isolate: string | undefined;

function report(trace: Trace, status: number) {
  if (trace.logged) return;
  isolate ??= crypto.randomUUID().slice(0, 8);
  trace.logged = true;
  const counts = { fetch: 0, d1: 0, kv: 0, cache: 0 };
  for (const e of trace.entries) counts[e.kind]++;
  console.log(
    JSON.stringify({
      timing: trace.label,
      isolate,
      status,
      totalMs: Date.now() - trace.start,
      counts,
      entries: trace.entries.sort((a, b) => a.at - b.at).map(row),
    }),
  );
}

export async function traced(label: string, run: () => Promise<Response>): Promise<Response> {
  const trace: Trace = { start: Date.now(), entries: [], logged: false, label };
  const response = await als.run(trace, run);
  if (!response.body) {
    report(trace, response.status);
    return response;
  }
  const body = response.body.pipeThrough(
    new TransformStream({
      flush() {
        report(trace, response.status);
      },
    }),
  );
  return new Response(body, response);
}
