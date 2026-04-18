import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { listBoxes, listQuestions } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ parent, cookies, platform }) => {
  const { session } = await parent();
  if (!session) return {};

  const env = platform!.env;
  const store = new CloudflareStore(env);
  const sessionId = cookies.get("mado_session") ?? "";

  const [boxes, questionsRaw, readRkeys, sessionTtl] = await Promise.all([
    listBoxes(session.did),
    listQuestions(session.did),
    store.listRead(session.did),
    store.sessionTtl(sessionId),
  ]);

  const readSet = new Set(readRkeys);
  const questions = questionsRaw.map((q) => ({ ...q, isRead: readSet.has(q.rkey) }));

  return { boxes, questions, sessionTtl };
};
