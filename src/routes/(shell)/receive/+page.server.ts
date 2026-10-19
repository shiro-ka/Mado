import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { listBoxes, getProfiles, getAnswersByOwner } from "$lib/atproto/index.js";
import { loadInbox } from "$lib/inbox.server.js";
import type { Answer } from "$lib/../types/index.js";

function latestAnswer(list: Answer[] = []) {
  return list.reduce<Answer | undefined>((last, a) => (!last || a.createdAt > last.createdAt ? a : last), undefined);
}

export const load: PageServerLoad = async ({ parent, platform, url }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const env = platform!.env;
  const store = new CloudflareStore(env);
  const tab = url.searchParams.get("tab") ?? "new";
  const prefs = await store.getNotificationPrefs(session.did);

  return {
    tab,
    dmTouched: prefs.touched,
    inbox: (async () => {
      const [questions, boxes, answers] = await Promise.all([
        loadInbox(store, session.did),
        listBoxes(session.did),
        getAnswersByOwner(session.did),
      ]);
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
          lastAnswer: latestAnswer(answers.get(q.uri))?.body,
          senderHandle: profile?.handle,
          senderDisplayName: profile?.displayName,
          senderAvatar: profile?.avatar,
        };
      });

      return { allQuestions };
    })(),
  };
};
