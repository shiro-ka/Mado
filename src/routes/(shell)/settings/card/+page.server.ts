import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { parseCardStyle, colorsOf } from "$lib/cardStyle.js";
import { listBoxes, getProfile } from "$lib/atproto/index.js";
import { resolveMainBoxRkey } from "$lib/mainBox.js";

export const load: PageServerLoad = async ({ parent, platform }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/?next=/settings/card");
  const store = new CloudflareStore(platform!.env);
  const [card, boxes, mainOverride, prof] = await Promise.all([
    store.getCardStyle(session.did),
    listBoxes(session.did),
    store.getMainBoxRkey(session.did),
    getProfile(session.did),
  ]);
  const mainRkey = resolveMainBoxRkey(boxes, mainOverride);
  const handle = prof?.handle ?? session.handle;
  return {
    colors: colorsOf(parseCardStyle(card?.style)),
    sample: {
      title: boxes.find((b) => b.rkey === mainRkey)?.title ?? "なんでも聞いてね",
      name: prof?.displayName || handle,
      handle,
      avatar: prof?.avatar ?? null,
    },
  };
};
