export const NO_MAIN_BOX = "";

export function resolveMainBoxRkey(
  boxes: { rkey: string; createdAt: string }[],
  override: string | null,
): string | null {
  if (override === NO_MAIN_BOX) return null;
  if (override && boxes.some((b) => b.rkey === override)) return override;
  const oldest = boxes.reduce<(typeof boxes)[number] | null>(
    (min, b) => (!min || b.createdAt.localeCompare(min.createdAt) < 0 ? b : min),
    null,
  );
  return oldest?.rkey ?? null;
}
