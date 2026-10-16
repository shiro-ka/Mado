import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getAnswersByOwner } from "$lib/atproto/index.js";

export const load: PageServerLoad = async ({ parent, platform }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const env = platform!.env;
  const store = new CloudflareStore(env);

  const sentRefs = await store.listSent(session.did, 200);

  const uniqueOwners = [...new Set(sentRefs.map((r) => r.ownerDid))];
  const answerMapEntries = await Promise.all(
    uniqueOwners.map(async (ownerDid) => {
      const map = await getAnswersByOwner(ownerDid);
      return { ownerDid, map };
    })
  );
  const allAnswers = new Map(
    answerMapEntries.flatMap(({ map }) => [...map.entries()])
  );

  const items = sentRefs.map(({ isRead, ...ref }) => {
    const koeUri = `at://${ref.ownerDid}/blue.mado.koe/${ref.koeRkey}`;
    const answers = allAnswers.get(koeUri) ?? [];
    return { ref, koeUri, answers, isRead };
  });

  return { items };
};
