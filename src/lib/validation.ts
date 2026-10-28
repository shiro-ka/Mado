import { z } from "zod";
import { fitsLimit } from "./text.js";

export const limitedText = (maxGraphemes: number, maxBytes: number) =>
  z.string().max(maxBytes).refine((s) => fitsLimit(s, maxGraphemes, maxBytes));

export const didSchema = z
  .string()
  .regex(/^did:(plc|web):[a-zA-Z0-9._%:-]+$/, "invalid DID");

export const rkeySchema = z
  .string()
  .min(1)
  .max(512)
  .regex(/^[a-zA-Z0-9._~:-]+$/, "invalid record key");

export const atUriSchema = z
  .string()
  .regex(
    /^at:\/\/did:[a-z]+:[a-zA-Z0-9._%:-]+\/[a-zA-Z0-9.]+\/[a-zA-Z0-9._~:-]+$/,
    "invalid AT-URI"
  );

const RESERVED_SLUGS = new Set(["new"]);

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "URLは2文字以上にしてください")
  .max(30, "URLは30文字以内にしてください")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "英小文字・数字・ハイフンのみ使えます（先頭と末尾は英数字）"
  )
  .refine((s) => !RESERVED_SLUGS.has(s), "そのURLは予約済みのため使えません");

export function slugFormatError(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const result = slugSchema.safeParse(v);
  return result.success ? null : result.error.issues[0]?.message ?? "使えないURLです";
}
