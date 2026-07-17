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

  const [boxes, questionsRaw, readRkeys, sessionTtl, answersByKoe] = await Promise.all([
    listBoxes(session.did),
    listQuestions(session.did),
    store.listRead(session.did),
    store.sessionTtl(sessionId),
    getAnswersByOwner(session.did),
  ]);

  const readSet = new Set(readRkeys);
  const questions = questionsRaw.map((q) => ({ ...q, isRead: readSet.has(q.rkey) }));
  const replyCount = [...answersByKoe.values()].reduce((n, a) => n + a.length, 0);

  return { session, boxes, questions, sessionTtl, replyCount };
};
