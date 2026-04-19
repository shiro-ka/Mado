import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { listQuestions, listBoxes } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ parent, platform, url }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const env = platform!.env;
  const store = new CloudflareStore(env);
  const tab = url.searchParams.get("tab") ?? "all";

  const [questionsRaw, readRkeys, boxes] = await Promise.all([
    listQuestions(session.did),
    store.listRead(session.did),
    listBoxes(session.did),
  ]);

  const readSet = new Set(readRkeys);
  const boxSlugMap = new Map(boxes.map((b) => [b.rkey, b.slug]));
  const allQuestions = questionsRaw.map((q) => {
    const boxRkey = q.boxUri.split("/").pop() ?? "";
    const slug = boxSlugMap.get(boxRkey);
    const href = slug ? `/@${session.handle}/${slug}/${q.rkey}` : `/receive`;
    return { ...q, isRead: readSet.has(q.rkey), href };
  });

  return { allQuestions, tab };
};
