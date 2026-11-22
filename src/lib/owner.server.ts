import { error } from "@sveltejs/kit";
import { resolveHandle, findBoxBySlug } from "./atproto/index.js";
import type { ViewerSession } from "./accounts.js";

export function handleFromParam(raw: string): string {
  return decodeURIComponent(raw).replace(/^@/, "");
}

export async function requireOwner(
  raw: string,
  viewer?: ViewerSession | null,
): Promise<{ handle: string; did: string }> {
  const handle = handleFromParam(raw);
  if (viewer && viewer.handle.toLowerCase() === handle.toLowerCase()) return { handle, did: viewer.did };
  const did = await resolveHandle(handle);
  if (!did) throw error(404, "ユーザーが見つかりません");
  return { handle, did };
}

export async function requireBox(did: string, slug: string) {
  const box = await findBoxBySlug(did, slug);
  if (!box) throw error(404, "窓が見つかりません");
  return box;
}
