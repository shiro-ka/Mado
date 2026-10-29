import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { parseCardStyle, colorsOf } from "$lib/cardStyle.js";

export const load: PageServerLoad = async ({ parent, platform }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/?next=/settings/card");
  const card = await new CloudflareStore(platform!.env).getCardStyle(session.did);
  return { colors: colorsOf(parseCardStyle(card?.style)) };
};
