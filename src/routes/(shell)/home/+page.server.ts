import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { listBoxes, getAnswersByOwner } from "$lib/atproto/index.js";
import { loadInbox } from "$lib/inbox.server.js";

export const load: PageServerLoad = async ({ parent, cookies, platform }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const env = platform!.env;
  const store = new CloudflareStore(env);
  const sessionId = cookies.get("mado_session") ?? "";
  const did = session.did;

  // sessionTtl is a single cheap KV read — keep it in the blocking path so the
  // expiry banner is correct on first paint. The PDS scans (boxes/questions/
  // answers) are the slow part; return them as an un-awaited promise so
  // SvelteKit streams them and navigation isn't blocked on bsky.social.
  const sessionTtl = await store.sessionTtl(sessionId);

  return {
    session,
    sessionTtl,
    dashboard: (async () => {
      const [boxes, questions, answersByKoe] = await Promise.all([
        listBoxes(did),
        loadInbox(store, did),
        getAnswersByOwner(did),
      ]);
      const replyCount = [...answersByKoe.values()].reduce((n, a) => n + a.length, 0);
      return { boxes, questions, replyCount };
    })(),
  };
};
