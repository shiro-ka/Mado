import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { handleFromParam, requireOwner } from "$lib/owner.server.js";
import { profilePath } from "$lib/urls.js";

export const load: PageServerLoad = async ({ parent, params }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, `/?next=${profilePath(handleFromParam(params.handle))}/new`);

  const { handle: cleanHandle, did } = await requireOwner(params.handle, session);
  if (session.did !== did) throw error(403, "権限がありません");

  return { cleanHandle };
};
