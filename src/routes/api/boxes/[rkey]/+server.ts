import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { z } from "zod";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { restoreOAuthSession } from "$lib/oauth.server.js";
import { getBoxRecord, updateBoxRecord, deleteBoxWithContents, listBoxes, invalidateRecords, NSID } from "$lib/atproto/index.js";
import { slugSchema } from "$lib/validation.js";

const updateSchema = z.object({
  title: z.string().min(1).max(30).optional(),
  description: z.string().max(300).optional(),
  isOpen: z.boolean().optional(),
  slug: slugSchema.optional(),
});

export const GET: RequestHandler = async ({ params, cookies, platform }) => {
  try {
    const env = platform!.env;
    const store = new CloudflareStore(env);
    const session = await getSession(cookies, store);
    if (!session) return json({ error: "Unauthorized" }, { status: 401 });

    const box = await getBoxRecord(session.did, params.rkey);
    if (!box) return json({ error: "Not found" }, { status: 404 });

    return json(box);
  } catch (err) {
    console.error("[GET /api/boxes/[rkey]]", err);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ params, request, cookies, platform }) => {
  try {
    const env = platform!.env;
    const store = new CloudflareStore(env);
    const session = await getSession(cookies, store);
    if (!session) return json({ error: "Unauthorized" }, { status: 401 });

    const sessionFetch = await restoreOAuthSession(env, store, session.did, session.deviceKey);
    if (!sessionFetch) {
      return json(
        { error: "Session expired", message: "再ログインが必要です" },
        { status: 401 }
      );
    }

    const box = await getBoxRecord(session.did, params.rkey);
    if (!box) return json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Invalid request" }, { status: 400 });

    const { title, description, isOpen, slug } = parsed.data;

    // Changing the slug changes the box's public URL (old shared links break —
    // the caller warns about that). Enforce per-owner uniqueness against the
    // *other* boxes before committing.
    if (slug && slug !== box.slug) {
      const existing = await listBoxes(session.did);
      if (existing.some((b) => b.rkey !== params.rkey && b.slug === slug)) {
        return json(
          { error: "Slug taken", message: "そのURLは既に使われています。別のURLにしてください。" },
          { status: 409 }
        );
      }
    }

    const success = await updateBoxRecord({
      sessionFetch,
      did: session.did,
      rkey: params.rkey,
      title: title ?? box.title,
      description: description ?? box.description,
      isOpen: isOpen ?? box.isOpen,
      slug: slug ?? box.slug,
      createdAt: box.createdAt,
    });

    if (!success) {
      return json(
        { error: "Update failed", message: "更新に失敗しました" },
        { status: 500 }
      );
    }

    invalidateRecords(session.did, NSID.BOX);
    return json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/boxes/[rkey]]", err);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params, cookies, platform }) => {
  try {
    const env = platform!.env;
    const store = new CloudflareStore(env);
    const session = await getSession(cookies, store);
    if (!session) return json({ error: "Unauthorized" }, { status: 401 });

    const sessionFetch = await restoreOAuthSession(env, store, session.did, session.deviceKey);
    if (!sessionFetch) {
      return json(
        { error: "Session expired", message: "再ログインが必要です" },
        { status: 401 }
      );
    }

    const success = await deleteBoxWithContents({
      sessionFetch,
      did: session.did,
      boxRkey: params.rkey,
    });

    if (!success) {
      return json(
        { error: "Delete failed", message: "削除に失敗しました" },
        { status: 500 }
      );
    }

    await store.delKeyPair(session.did, params.rkey);
    return json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/boxes/[rkey]]", err);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
