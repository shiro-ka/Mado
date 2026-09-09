import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { resolveHandle, findBoxBySlug, getProfile, listBoxes } from "$lib/atproto/index.js";

export const load: PageServerLoad = async ({ parent, params, platform, url }) => {
  const { session } = await parent();
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  const did = await resolveHandle(cleanHandle);
  if (!did) throw error(404, "窓が見つかりません");

  const env = platform!.env;
  const store = new CloudflareStore(env);

  const isOwner = session?.did === did;

  const [box, ownerProfile, ownerRegistered] = await Promise.all([
    findBoxBySlug(did, params.slug),
    getProfile(did),
    store.ownerHasAnyDevice(did),
  ]);

  if (!box) throw error(404, "窓が見つかりません");

  // Whether this box is the owner's main Mado (override if live, else oldest).
  // Only needed for the owner's settings view.
  let isMain = false;
  if (isOwner) {
    const [overrideRkey, boxes] = await Promise.all([
      store.getMainBoxRkey(did),
      listBoxes(did),
    ]);
    const oldestRkey =
      [...boxes].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))[0]?.rkey ??
      null;
    const mainRkey =
      overrideRkey && boxes.some((b) => b.rkey === overrideRkey) ? overrideRkey : oldestRkey;
    isMain = box.rkey === mainRkey;
  }

  return {
    cleanHandle,
    box,
    ownerProfile,
    ownerRegistered,
    isOwner,
    isMain,
    origin: url.origin,
  };
};
