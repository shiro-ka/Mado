import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { listQuestions, listBoxes, getAnswersByOwner } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ parent, platform, url }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const store = new CloudflareStore(platform!.env);
  const tab = url.searchParams.get("tab") ?? "unreplied";

  const [questionsRaw, dismissedRkeys, answersByKoe, boxes] = await Promise.all([
    listQuestions(session.did),
    store.listDismissed(session.did),
    getAnswersByOwner(session.did),
    listBoxes(session.did),
  ]);

  const dismissedSet = new Set(dismissedRkeys);
  const boxSlugMap = new Map(boxes.map((b) => [b.rkey, b.slug]));

  const allQuestions = questionsRaw
    .map((q) => {
      const boxRkey = q.boxUri.split("/").pop() ?? "";
      const slug = boxSlugMap.get(boxRkey);
      const href = slug ? `/@${session.handle}/${slug}/${q.rkey}` : "/receive";
      const answerCount = answersByKoe.get(q.uri)?.length ?? 0;
      return {
        ...q,
        answered: answerCount > 0,
        answerCount,
        dismissed: dismissedSet.has(q.rkey),
        href,
        koeUri: q.uri,
        pageUrl: slug ? `${url.origin}${href}` : url.origin,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { allQuestions, tab };
};
