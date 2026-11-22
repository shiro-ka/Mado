import { z } from "zod";

export const DEFAULT_STYLE = { icon: "#78aef3", background: "#11172b", bubble: "#1a2135" };

export const CARD_SLOTS = ["background", "bubble", "icon"] as const;
export type CardSlot = (typeof CARD_SLOTS)[number];
export type CardStyle = Partial<Record<CardSlot, string | null>>;

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
export const colorSchema = z.string().regex(HEX_COLOR);

export function isColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

export const CARD_PALETTE: Record<CardSlot, string[]> = {
  background: [DEFAULT_STYLE.background, "#18181b", "#121325", "#262b36", "#f7f8fa", "#e6f0fb"],
  bubble: [DEFAULT_STYLE.bubble, "#212124", "#1b1c2f", "#303540", "#ffffff", "#d8ebff"],
  icon: [DEFAULT_STYLE.icon, "#f48d3c", "#9bb93d", "#44c1b8", "#c58ff3", "#f47eb0"],
};

const colorPart = z.object({
  kind: z.literal("color"),
  value: colorSchema,
});

export const cardStyleDoc = z.object(
  Object.fromEntries(CARD_SLOTS.map((slot) => [slot, colorPart.optional()])) as Record<CardSlot, z.ZodOptional<typeof colorPart>>,
);
export type CardStyleDoc = z.infer<typeof cardStyleDoc>;

export function parseCardStyle(raw: unknown): CardStyleDoc {
  const parsed = cardStyleDoc.safeParse(raw);
  return parsed.success ? parsed.data : {};
}

export function colorsOf(doc: CardStyleDoc): CardStyle {
  return Object.fromEntries(CARD_SLOTS.map((slot) => [slot, doc[slot]?.value ?? null]));
}
