import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { listQuestions, listBoxes, getProfiles } from "$lib/atproto/index.js";
import { decryptDid } from "$lib/crypto.js";

export const load: PageServerLoad = async ({ parent, platform, url }) => {
  const { session } = await parent();
  if (!session) throw redirect(303, "/auth/login");

  const env = platform!.env;
  const store = new CloudflareStore(env);
  const tab = url.searchParams.get("tab") ?? "unread";

  // The PDS scans (questions + boxes) are the slow part; return them as an
  // un-awaited promise so SvelteKit streams the inbox and the page shell paints
  // immediately instead of freezing on the previous page for 2-3s.
  return {
    tab,
    inbox: (async () => {
      const [questionsRaw, readRkeys, boxes] = await Promise.all([
        listQuestions(session.did),
        store.listRead(session.did),
        listBoxes(session.did),
      ]);

      const readSet = new Set(readRkeys);
      const boxSlugMap = new Map(boxes.map((b) => [b.rkey, b.slug]));
      const keys = new Map(
        await Promise.all(
          boxes.map(async (b) => [b.rkey, await store.getKeyPair(session.did, b.rkey)] as const),
        ),
      );
      const senders = questionsRaw.map((q) => {
        const key = keys.get(q.boxUri.split("/").pop() ?? "");
        if (!key) return undefined;
        try {
          return decryptDid(key, q.encryptedFrom);
        } catch {
          return undefined;
        }
      });
      const profiles = await getProfiles([...new Set(senders.filter((d): d is string => !!d))]);
      const allQuestions = questionsRaw.map((q, i) => {
        const boxRkey = q.boxUri.split("/").pop() ?? "";
        const slug = boxSlugMap.get(boxRkey);
        const href = slug ? `/@${session.handle}/${slug}/${q.rkey}` : `/receive`;
        const { encryptedFrom: _, ...rest } = q;
        const profile = senders[i] ? profiles.get(senders[i]) : undefined;
        return {
          ...rest,
          isRead: readSet.has(q.rkey),
          href,
          senderDid: senders[i],
          senderHandle: profile?.handle,
          senderDisplayName: profile?.displayName,
          senderAvatar: profile?.avatar,
        };
      });

      return { allQuestions };
    })(),
  };
};
