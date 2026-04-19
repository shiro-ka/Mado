import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getAnswersByOwner } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ parent, platform }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const env = platform!.env;
  const store = new CloudflareStore(env);

  const sentRefs = await store.listSent(session.did, 200);
  const readMembers = await (async () => {
    const reads: string[] = [];
    for (const ref of sentRefs) {
      const token = `${ref.ownerDid}:${ref.koeRkey}`;
      const isRead = await store.isSentRead(session.did, token);
      if (isRead) reads.push(token);
    }
    return reads;
  })();
  const readSet = new Set(readMembers);

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

  const items = sentRefs.map((ref) => {
    const koeUri = `at://${ref.ownerDid}/blue.mado.koe/${ref.koeRkey}`;
    const answers = allAnswers.get(koeUri) ?? [];
    const isRead = readSet.has(`${ref.ownerDid}:${ref.koeRkey}`);
    return { ref, koeUri, answers, isRead };
  });

  return { items };
};
