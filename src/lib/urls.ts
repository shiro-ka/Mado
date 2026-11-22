export const NSID = {
  BOX: "blue.mado.box",
  KOE: "blue.mado.koe",
  ANSWER: "blue.mado.answer",
} as const;

export function profilePath(handle: string): string {
  return `/@${handle}`;
}

export function boxPath(handle: string, slug: string): string {
  return `${profilePath(handle)}/${slug}`;
}

export function koePath(handle: string, slug: string, rkey: string): string {
  return `${boxPath(handle, slug)}/${rkey}`;
}

export function ogImagePath(pagePath: string, version?: number | null): string {
  return `/og${pagePath}${version ? `?v=${version}` : ""}`;
}

export function boxUri(did: string, rkey: string): string {
  return `at://${did}/${NSID.BOX}/${rkey}`;
}

export function koeUri(did: string, rkey: string): string {
  return `at://${did}/${NSID.KOE}/${rkey}`;
}

export function rkeyOfUri(uri: string): string {
  return uri.split("/").pop() ?? "";
}
