import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { resolveHandle, getProfile, listBoxes } from "$lib/atproto/index.js";
import { resolveMainBoxRkey } from "$lib/mainBox.js";

export const load: PageServerLoad = async ({ parent, params, platform, url }) => {
  const { session } = await parent();
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  const did =
    session && session.handle.toLowerCase() === cleanHandle.toLowerCase()
      ? session.did
      : await resolveHandle(cleanHandle);
  if (!did) throw error(404, "ユーザーが見つかりません");

  const isOwner = session?.did === did;
  const store = platform ? new CloudflareStore(platform.env) : null;

  const profilePromise = getProfile(did).catch(() => null);
  const [headProfile, card] = await Promise.all([
    isOwner ? null : profilePromise,
    store?.getCardStyle(did) ?? null,
  ]);
  const ownerName = isOwner
    ? session!.displayName || session!.handle
    : headProfile?.displayName || headProfile?.handle || cleanHandle;

  return {
    isOwner,
    cleanHandle,
    did,
    origin: url.origin,
    session,
    ownerName,
    cardVersion: card?.updatedAt ?? null,
    detail: (async () => {
      const [profile, boxes] = await Promise.all([profilePromise, listBoxes(did)]);

      const byAge = [...boxes].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
      const mainBoxRkey = resolveMainBoxRkey(boxes, store ? await store.getMainBoxRkey(did) : null);

      if (isOwner) {
        const openBoxes = [...boxes].sort((a, b) => {
          if (a.rkey === mainBoxRkey) return -1;
          if (b.rkey === mainBoxRkey) return 1;
          return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
        });
        return {
          profile,
          mainBoxRkey,
          openBoxes,
          box: null,
          subBoxes: [],
          ownerRegistered: false,
        };
      }

      const openList = byAge.filter((b) => b.isOpen);
      const mainBox = boxes.find((b) => b.rkey === mainBoxRkey) ?? null;
      const featured = mainBoxRkey === null ? null : mainBox && mainBox.isOpen ? mainBox : openList[0] ?? null;
      const subBoxes = openList.filter((b) => b.rkey !== featured?.rkey);
      const ownerRegistered = store ? await store.ownerHasAnyDevice(did) : false;

      return {
        profile,
        mainBoxRkey,
        openBoxes: [],
        box: featured,
        subBoxes,
        ownerRegistered,
      };
    })(),
  };
};
