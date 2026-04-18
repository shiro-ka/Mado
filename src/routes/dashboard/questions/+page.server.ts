import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { listQuestions } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ parent, platform, url }) => {
  const { session } = await parent();
  const env = platform!.env;
  const store = new CloudflareStore(env);

  const tab = url.searchParams.get("tab") ?? "all";

  const [questionsRaw, readRkeys] = await Promise.all([
    listQuestions(session.did),
    store.listRead(session.did),
  ]);

  const readSet = new Set(readRkeys);
  const allQuestions = questionsRaw.map((q) => ({ ...q, isRead: readSet.has(q.rkey) }));

  return { allQuestions, tab };
};
