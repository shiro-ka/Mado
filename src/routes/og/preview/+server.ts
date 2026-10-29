import type { RequestHandler } from "./$types";
import { error } from "@sveltejs/kit";
import { CloudflareStore } from "$lib/store.js";
import { getSession } from "$lib/auth.server.js";
import { listBoxes, getProfile } from "$lib/atproto/index.js";
import { resolveMainBoxRkey } from "$lib/mainBox.js";
import { themeFor, renderOg, truncate, fetchImageDataUri, boxCardHtml, koeCardHtml } from "$lib/og";

const SAMPLE_TITLE = "なんでも聞いてね";
const SAMPLE_VOICE = "ここに届いた声が入ります";

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
  const env = platform!.env;
  const store = new CloudflareStore(env);
  const session = await getSession(cookies, store);
  if (!session) throw error(401, "ログインが必要です");

  const q = url.searchParams;
  const t = themeFor({ background: q.get("background"), bubble: q.get("bubble"), icon: q.get("icon") });

  const [boxes, mainOverride, prof] = await Promise.all([
    listBoxes(session.did),
    store.getMainBoxRkey(session.did),
    getProfile(session.did),
  ]);
  const mainRkey = resolveMainBoxRkey(boxes, mainOverride);
  const title = truncate(boxes.find((b) => b.rkey === mainRkey)?.title ?? SAMPLE_TITLE, 32);
  const handle = prof?.handle ?? session.handle;
  const name = prof?.displayName || handle;
  const avatarUri = await fetchImageDataUri(prof?.avatar);

  const html =
    q.get("kind") === "koe"
      ? koeCardHtml(t, { body: SAMPLE_VOICE, boxTitle: title, name, handle, avatarUri })
      : boxCardHtml(t, { title, name, handle, avatarUri });
  const text = title + SAMPLE_VOICE + name + "の窓への声@" + handle + "Mado";
  return renderOg(html, text, platform?.ctx, "private, no-store");
};
