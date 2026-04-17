import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getBoxRecord } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ parent, params }) => {
  const { session } = await parent();
  const box = await getBoxRecord(session.did, params.rkey);
  if (!box) throw error(404, "質問箱が見つかりません");
  return { box };
};
