import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { resolveHandle } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ parent, params }) => {
  const { session } = await parent();
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  if (!session) throw redirect(303, `/auth/login?next=/@${cleanHandle}/new`);

  const ownerDid = await resolveHandle(cleanHandle);
  if (!ownerDid || session.did !== ownerDid) throw error(403, "権限がありません");

  return { cleanHandle };
};
