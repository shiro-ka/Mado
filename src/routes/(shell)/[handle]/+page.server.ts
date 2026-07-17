import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { CloudflareStore } from "$lib/store.js";
import { resolveHandle, getProfile, listBoxes } from "$lib/atproto.js";

export const load: PageServerLoad = async ({ parent, params, platform, url }) => {
  const { session } = await parent();
  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  // Viewing your own page (the sidebar "マイページ" link) is the common case —
  // the session already holds the DID, so skip the network handle resolution.
  const did =
    session && session.handle.toLowerCase() === cleanHandle.toLowerCase()
      ? session.did
      : await resolveHandle(cleanHandle);
  if (!did) throw error(404, "ユーザーが見つかりません");

  const [profile, boxes] = await Promise.all([getProfile(did), listBoxes(did)]);
  const isOwner = session?.did === did;
  const store = platform ? new CloudflareStore(platform.env) : null;

  // Main box = the owner's override if it still points at a live box, else the
  // oldest box by createdAt.
  const byAge = [...boxes].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  const oldestRkey = byAge[0]?.rkey ?? null;
  const overrideRkey = store ? await store.getMainBoxRkey(did) : null;
  const mainBoxRkey =
    overrideRkey && boxes.some((b) => b.rkey === overrideRkey) ? overrideRkey : oldestRkey;

  if (isOwner) {
    // Owner: manage view — the full box list with the main box pinned on top.
    const openBoxes = [...boxes].sort((a, b) => {
      if (a.rkey === mainBoxRkey) return -1;
      if (b.rkey === mainBoxRkey) return 1;
      return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
    });
    return {
      isOwner,
      cleanHandle,
      did,
      profile,
      mainBoxRkey,
      origin: url.origin,
      openBoxes,
      box: null,
      subBoxes: [],
      ownerRegistered: false,
    };
  }

  // Visitor: send view — the main box's send form up top, sub boxes listed below.
  const openList = byAge.filter((b) => b.isOpen);
  const mainBox = boxes.find((b) => b.rkey === mainBoxRkey) ?? null;
  // Feature the main box if it's open; otherwise fall back to the oldest open box
  // so a visitor still lands on a usable send form when one exists.
  const featured = mainBox && mainBox.isOpen ? mainBox : openList[0] ?? null;
  const subBoxes = openList.filter((b) => b.rkey !== featured?.rkey);

  const ownerRegistered = store ? await store.ownerHasAnyDevice(did) : false;

  return {
    isOwner,
    cleanHandle,
    did,
    profile,
    mainBoxRkey,
    origin: url.origin,
    openBoxes: [],
    box: featured,
    subBoxes,
    ownerRegistered,
  };
};
