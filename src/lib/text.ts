export const POST_MAX_GRAPHEMES = 300;
export const POST_MAX_BYTES = 3000;
export const BOX_DESCRIPTION_MAX_GRAPHEMES = 300;
export const BOX_DESCRIPTION_MAX_BYTES = 1800;

const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
const encoder = new TextEncoder();

export function graphemeLength(text: string): number {
  let count = 0;
  for (const _ of segmenter.segment(text)) count++;
  return count;
}

export function byteLength(text: string): number {
  return encoder.encode(text).length;
}

export function fitsLimit(text: string, maxGraphemes: number, maxBytes: number): boolean {
  return graphemeLength(text) <= maxGraphemes && byteLength(text) <= maxBytes;
}
