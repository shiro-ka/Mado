import type { SessionFetch } from "../oauth.server.js";
import { xrpc } from "./client.js";

export async function getViewerFollowsActor(
  sessionFetch: SessionFetch,
  actorDid: string
): Promise<boolean> {
  try {
    const data = await xrpc<{ viewer?: { following?: string } }>({
      sessionFetch,
      method: "GET",
      lexicon: `app.bsky.actor.getProfile?actor=${encodeURIComponent(actorDid)}`,
    });
    return typeof data.viewer?.following === "string";
  } catch (err) {
    console.warn("[getViewerFollowsActor]", err);
    return false;
  }
}

export async function writeFollow(params: {
  sessionFetch: SessionFetch;
  did: string;
  subjectDid: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { sessionFetch, did, subjectDid } = params;
  try {
    const record = {
      $type: "app.bsky.graph.follow",
      subject: subjectDid,
      createdAt: new Date().toISOString(),
    };
    return await xrpc<{ uri: string; cid: string }>({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.createRecord",
      body: { repo: did, collection: "app.bsky.graph.follow", record },
    });
  } catch {
    return null;
  }
}

async function uploadThumb(
  sessionFetch: SessionFetch,
  imageUrl: string
): Promise<unknown | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const data = await imgRes.arrayBuffer();
    const uploadRes = await sessionFetch("/xrpc/com.atproto.repo.uploadBlob", {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: data,
    });
    if (!uploadRes.ok) return null;
    const json = (await uploadRes.json()) as { blob: unknown };
    return json.blob;
  } catch {
    return null;
  }
}

export async function createBskyPost(params: {
  sessionFetch: SessionFetch;
  ownerDid: string;
  text: string;
  pageUrl?: string;
  ownerName?: string;
}): Promise<{ uri: string; cid: string } | null> {
  const { sessionFetch, ownerDid, text, pageUrl, ownerName } = params;

  const record: Record<string, unknown> = {
    $type: "app.bsky.feed.post",
    text,
    createdAt: new Date().toISOString(),
    langs: ["ja"],
  };

  if (pageUrl) {
    const ogImageUrl = pageUrl.replace("/@", "/og/@");
    const thumb = await uploadThumb(sessionFetch, ogImageUrl);
    record.embed = {
      $type: "app.bsky.embed.external",
      external: {
        uri: pageUrl,
        title: ownerName ? `${ownerName} への声 - Mado 半匿名メッセージ` : "Mado 半匿名メッセージ",
        description: "",
        ...(thumb ? { thumb } : {}),
      },
    };
  }

  try {
    return await xrpc<{ uri: string; cid: string }>({
      sessionFetch,
      method: "POST",
      lexicon: "com.atproto.repo.createRecord",
      body: {
        repo: ownerDid,
        collection: "app.bsky.feed.post",
        record,
      },
    });
  } catch {
    return null;
  }
}
