import type { PageServerLoad } from "./$types";
import { getProfile, listBoxes } from "$lib/atproto/index.js";
import { requireOwner } from "$lib/owner.server.js";
import { resolveMainBoxRkey } from "$lib/mainBox.js";
import type { CloudflareStore } from "$lib/store.js";
import type { QuestionBox } from "$lib/../types/index.js";

type Profile = Promise<Awaited<ReturnType<typeof getProfile>>>;

function byAge(a: QuestionBox, b: QuestionBox) {
  return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
}

async function loadBoxes(did: string, store: CloudflareStore | null) {
  const [boxes, saved] = await Promise.all([listBoxes(did), store?.getMainBoxRkey(did) ?? null]);
  return { boxes: [...boxes].sort(byAge), mainBoxRkey: resolveMainBoxRkey(boxes, saved) };
}

async function ownerDetail(did: string, store: CloudflareStore | null, profile: Profile) {
  const [{ boxes, mainBoxRkey }, p] = await Promise.all([loadBoxes(did, store), profile]);
  const main = boxes.filter((b) => b.rkey === mainBoxRkey);
  return {
    profile: p,
    mainBoxRkey,
    boxes: [...main, ...boxes.filter((b) => b.rkey !== mainBoxRkey)],
  };
}

async function visitorDetail(did: string, store: CloudflareStore | null, profile: Profile) {
  const [{ boxes, mainBoxRkey }, p, ownerRegistered] = await Promise.all([
    loadBoxes(did, store),
    profile,
    store?.ownerHasAnyDevice(did) ?? false,
  ]);
  const open = boxes.filter((b) => b.isOpen);
  const box = open.find((b) => b.rkey === mainBoxRkey) ?? null;
  return {
    profile: p,
    box,
    subBoxes: open.filter((b) => b !== box),
    ownerRegistered,
  };
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const session = await locals.getSession();
  const { handle: cleanHandle, did } = await requireOwner(params.handle, session);
  const store = locals.store;

  const profile = getProfile(did).catch(() => null);
  const cardVersion = store?.getCardStyle(did).then((c) => c?.updatedAt ?? null) ?? null;
  const common = { cleanHandle, origin: url.origin };

  if (session?.did === did) {
    return {
      ...common,
      isOwner: true as const,
      ownerName: session.displayName || session.handle,
      cardVersion: await cardVersion,
      detail: ownerDetail(did, store, profile),
    };
  }

  const [p, version] = await Promise.all([profile, cardVersion]);
  return {
    ...common,
    isOwner: false as const,
    ownerName: p?.displayName || p?.handle || cleanHandle,
    cardVersion: version,
    detail: visitorDetail(did, store, profile),
  };
};
