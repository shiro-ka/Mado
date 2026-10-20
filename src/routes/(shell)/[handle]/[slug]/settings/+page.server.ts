import { error, redirect } from "@sveltejs/kit";
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

  if (session?.did !== did) throw redirect(303, `/@${cleanHandle}/${params.slug}`);

  const [box, ownerProfile] = await Promise.all([
    findBoxBySlug(did, params.slug),
    getProfile(did),
  ]);

  if (!box) throw error(404, "窓が見つかりません");

  const [overrideRkey, boxes] = await Promise.all([
    store.getMainBoxRkey(did),
    listBoxes(did),
  ]);
  const oldestRkey =
    [...boxes].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))[0]?.rkey ??
    null;
  const mainRkey =
    overrideRkey && boxes.some((b) => b.rkey === overrideRkey) ? overrideRkey : oldestRkey;
  const isMain = box.rkey === mainRkey;

  return {
    cleanHandle,
    box,
    ownerProfile,
    isMain,
    origin: url.origin,
  };
};
