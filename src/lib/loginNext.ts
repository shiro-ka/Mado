export function safeNext(next: unknown): string | undefined {
  if (typeof next !== "string" || next.length > 512) return undefined;
  return /^\/(?![/\\])[^\s\\]*$/.test(next) ? next : undefined;
}
