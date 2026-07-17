import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { listBoxes, listQuestions, getAnswersByOwner } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ parent, cookies, platform }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const env = platform!.env;
  const store = new CloudflareStore(env);
  const sessionId = cookies.get("mado_session") ?? "";

  const [boxes, questionsRaw, dismissedRkeys, sessionTtl, answersByKoe] = await Promise.all([
    listBoxes(session.did),
    listQuestions(session.did),
    store.listDismissed(session.did),
    store.sessionTtl(sessionId),
    getAnswersByOwner(session.did),
  ]);

  const dismissedSet = new Set(dismissedRkeys);
  const questions = questionsRaw
    .map((q) => {
      const answered = (answersByKoe.get(q.uri)?.length ?? 0) > 0;
      const dismissed = dismissedSet.has(q.rkey);
      return { ...q, answered, dismissed, unreplied: !answered && !dismissed };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unrepliedCount = questions.filter((q) => q.unreplied).length;
  const replyCount = [...answersByKoe.values()].reduce((n, a) => n + a.length, 0);

  return { session, boxes, questions, sessionTtl, replyCount, unrepliedCount };
};
