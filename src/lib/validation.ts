import { z } from "zod";

/**
 * Shared shape validators for atproto identifiers reaching D1/PDS writes.
 *
 * These are intentionally permissive on the identifier body but strict on the
 * *shape* — the goal is to reject handles, empty strings, and path-injection
 * attempts (e.g. a slashed value smuggled into an AT-URI), not to fully verify
 * that a DID resolves.
 */

// did:plc:<base32> or did:web:<host> and similar method-specific ids.
export const didSchema = z
  .string()
  .regex(/^did:(plc|web):[a-zA-Z0-9._%:-]+$/, "invalid DID");

// A record key: no slashes / control chars (would break AT-URI construction).
export const rkeySchema = z
  .string()
  .min(1)
  .max(512)
  .regex(/^[a-zA-Z0-9._~:-]+$/, "invalid record key");

// at://<did>/<collection>/<rkey>
export const atUriSchema = z
  .string()
  .regex(
    /^at:\/\/did:[a-z]+:[a-zA-Z0-9._%:-]+\/[a-zA-Z0-9.]+\/[a-zA-Z0-9._~:-]+$/,
    "invalid AT-URI"
  );

// Slugs that would collide with a sibling route under /@handle/. Keep in sync
// with the route tree (currently only /@handle/new exists at that level).
const RESERVED_SLUGS = new Set(["new"]);

// User-chosen box slug — the human-readable tail of a box's public URL
// (/@handle/<slug>). Lowercased + trimmed, then constrained to a memorable,
// URL-safe shape: lowercase alnum groups joined by single hyphens, no leading/
// trailing/double hyphens, and not a reserved route word.
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
