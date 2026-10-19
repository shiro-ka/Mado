import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { listBoxes, getProfiles } from "$lib/atproto/index.js";
import { loadInbox } from "$lib/inbox.server.js";

export const load: PageServerLoad = async ({ parent, platform, url }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const env = platform!.env;
  const store = new CloudflareStore(env);
  const tab = url.searchParams.get("tab") ?? "new";

  // The PDS scans (questions + boxes) are the slow part; return them as an
  // un-awaited promise so SvelteKit streams the inbox and the page shell paints
  // immediately instead of freezing on the previous page for 2-3s.
  return {
    tab,
    inbox: (async () => {
      const [questions, boxes] = await Promise.all([loadInbox(store, session.did), listBoxes(session.did)]);
      const boxMap = new Map(boxes.map((b) => [b.rkey, b]));
      const profiles = await getProfiles([
        ...new Set(questions.map((q) => q.senderDid).filter((d): d is string => !!d)),
      ]);
      const allQuestions = questions.map((q) => {
        const box = boxMap.get(q.boxUri.split("/").pop() ?? "");
        const href = box ? `/@${session.handle}/${box.slug}/${q.rkey}` : `/receive`;
        const profile = q.senderDid ? profiles.get(q.senderDid) : undefined;
        return {
          ...q,
          href,
          boxTitle: box?.title,
          senderHandle: profile?.handle,
          senderDisplayName: profile?.displayName,
          senderAvatar: profile?.avatar,
        };
      });

      return { allQuestions };
    })(),
  };
};
