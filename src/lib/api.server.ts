import { json, type RequestEvent } from "@sveltejs/kit";
import type { z } from "zod";
import type { AppSession, CloudflareStore } from "./store.js";

export function appOrigin(env: App.Platform["env"]): string {
  return env.APP_URL ?? "https://mado.blue";
}

export function fail(status: number, message: string): Response {
  return json({ message }, { status });
}

export async function readJson<T extends z.ZodTypeAny>(request: Request, schema: T): Promise<z.infer<T> | null> {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  return parsed.success ? parsed.data : null;
}

export type Authed<E extends RequestEvent> = {
  event: E;
  env: App.Platform["env"];
  store: CloudflareStore;
  session: AppSession;
};

export async function withSession<E extends RequestEvent>(
  event: E,
  handler: (ctx: Authed<E>) => Promise<Response>,
): Promise<Response> {
  const session = await event.locals.getSession();
  if (!session) return fail(401, "ログインが必要です");
  try {
    return await handler({ event, env: event.platform!.env, store: event.locals.store!, session });
  } catch (err) {
    console.error(`[${event.request.method} ${event.url.pathname}]`, err);
    return fail(500, "サーバーでエラーが起きました");
  }
}
