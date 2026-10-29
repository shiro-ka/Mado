import { z } from "zod";
import { DEFAULT_STYLE, type CardStyle } from "./og.js";

export const CARD_SLOTS = ["background", "bubble", "icon"] as const;
export type CardSlot = (typeof CARD_SLOTS)[number];

export const CARD_PALETTE: Record<CardSlot, string[]> = {
  background: [DEFAULT_STYLE.background, "#18181b", "#121325", "#262b36", "#f7f8fa", "#e6f0fb"],
  bubble: [DEFAULT_STYLE.bubble, "#212124", "#1b1c2f", "#303540", "#ffffff", "#d8ebff"],
  icon: [DEFAULT_STYLE.icon, "#f48d3c", "#9bb93d", "#44c1b8", "#c58ff3", "#f47eb0"],
};

const colorPart = z.object({
  kind: z.literal("color"),
  value: z.string().regex(/^#[0-9a-f]{6}$/i),
});

export const cardStyleDoc = z.object({
  background: colorPart.optional(),
  bubble: colorPart.optional(),
  icon: colorPart.optional(),
});
export type CardStyleDoc = z.infer<typeof cardStyleDoc>;

export function parseCardStyle(raw: unknown): CardStyleDoc {
  const parsed = cardStyleDoc.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

export function colorsOf(doc: CardStyleDoc): CardStyle {
  return {
    background: doc.background?.value ?? null,
    bubble: doc.bubble?.value ?? null,
    icon: doc.icon?.value ?? null,
  };
}
