import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { parseCardStyle, colorsOf } from "$lib/cardStyle.js";
import { getProfile } from "$lib/atproto/index.js";

export const load: PageServerLoad = async ({ parent, platform }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/?next=/settings/card");
  const [card, prof] = await Promise.all([
    new CloudflareStore(platform!.env).getCardStyle(session.did),
    getProfile(session.did),
  ]);
  const handle = prof?.handle ?? session.handle;
  return {
    colors: colorsOf(parseCardStyle(card?.style)),
    sample: { name: prof?.displayName || handle, handle, avatar: prof?.avatar ?? null },
  };
};
