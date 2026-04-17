import type { PageServerLoad } from "./$types";
import { listBoxes, getProfile } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ parent, platform }) => {
  const { session } = await parent();
  const env = platform!.env;
  const appUrl = env.NEXT_PUBLIC_APP_URL ?? "https://mado.blue";

  const [boxes, resolvedProfile] = await Promise.all([
    listBoxes(session.did),
    session.handle.startsWith("did:") ? getProfile(session.did) : null,
  ]);

  const ownerHandle = resolvedProfile?.handle ?? session.handle;

  return { boxes, ownerHandle, appUrl };
};
