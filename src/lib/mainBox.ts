export const NO_MAIN_BOX = "";

export function resolveMainBoxRkey(
  boxes: { rkey: string; createdAt?: string }[],
  override: string | null,
): string | null {
  if (override === NO_MAIN_BOX) return null;
  if (override && boxes.some((b) => b.rkey === override)) return override;
  const oldest = [...boxes].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))[0];
  return oldest?.rkey ?? null;
}
