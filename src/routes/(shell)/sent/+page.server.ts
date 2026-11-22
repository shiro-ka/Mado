import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { getAnswersByOwner, getProfiles, listBoxes } from "$lib/atproto/index.js";
import type { SentItem } from "../../../types/index.js";
import { koePath, koeUri } from "$lib/urls.js";

export const load: PageServerLoad = async ({ locals, platform }) => {
  const session = await locals.getSession();
  if (!session) throw redirect(303, "/?next=/sent");

  const store = new CloudflareStore(platform!.env);

  return {
    sent: (async () => {
      const refs = await store.listSent(session.did, 200);

      const owners = [...new Set(refs.map((r) => r.ownerDid))];
      const [perOwner, profiles] = await Promise.all([
        Promise.all(
          owners.map(async (did) => {
            const [boxes, answers] = await Promise.all([listBoxes(did), getAnswersByOwner(did)]);
            return [did, { boxes: new Map(boxes.map((b) => [b.rkey, b])), answers }] as const;
          }),
        ),
        getProfiles(owners),
      ]);
      const byOwner = new Map(perOwner);

      return refs.map((r): SentItem => {
        const owner = byOwner.get(r.ownerDid);
        const profile = profiles.get(r.ownerDid);
        const box = r.boxRkey ? owner?.boxes.get(r.boxRkey) : undefined;
        const answers = owner?.answers.get(koeUri(r.ownerDid, r.koeRkey)) ?? [];
        const latest = answers.at(-1)?.createdAt;
        return {
          ownerDid: r.ownerDid,
          koeRkey: r.koeRkey,
          body: r.body,
          sentAt: r.sentAt,
          href: box && profile?.handle ? koePath(profile.handle, box.slug, r.koeRkey) : undefined,
          boxTitle: box?.title,
          ownerHandle: profile?.handle,
          ownerDisplayName: profile?.displayName,
          ownerAvatar: profile?.avatar,
          answers: answers.map((a) => a.body),
          hasNewAnswer: !!latest && (r.readAt === null || Date.parse(latest) > Date.parse(r.readAt)),
        };
      });
    })(),
  };
};
