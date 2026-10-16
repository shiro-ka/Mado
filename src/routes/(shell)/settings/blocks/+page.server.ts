import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getProfiles } from "$lib/atproto/index.js";

export const load: PageServerLoad = async ({ parent, platform }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const store = new CloudflareStore(platform!.env);
  const dids = await store.listBlocks(session.did);
  const profiles = await getProfiles(dids);
  return {
    blocked: dids.map((did) => ({ did, ...profiles.get(did) })),
  };
};
