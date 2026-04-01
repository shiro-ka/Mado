import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { ja } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string for display.
 * - Today: "今日 HH:mm"
 * - Yesterday: "昨日 HH:mm"
 * - Within a week: relative (e.g. "3日前")
 * - Otherwise: "yyyy/MM/dd"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  if (isToday(date)) {
    return `今日 ${format(date, "HH:mm")}`;
  }

  if (isYesterday(date)) {
    return `昨日 ${format(date, "HH:mm")}`;
  }

  const diffMs = Date.now() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 7) {
    return formatDistanceToNow(date, { addSuffix: true, locale: ja });
  }

  return format(date, "yyyy/MM/dd", { locale: ja });
}

/**
 * Format a date string as a full datetime for tooltips / detailed views.
 */
export function formatDateFull(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "yyyy年M月d日 HH:mm", { locale: ja });
}

/**
 * Truncate text to a maximum length, adding ellipsis if truncated.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + "…";
}

/**
 * Normalize a Bluesky handle – strip leading @ if present.
 */
export function normalizeHandle(handle: string): string {
  return handle.startsWith("@") ? handle.slice(1) : handle;
}

/**
 * Validate a Bluesky handle format.
 */
export function isValidHandle(handle: string): boolean {
  const normalized = normalizeHandle(handle);
  // Basic handle validation: domain-like format
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(
    normalized
  );
}

/**
 * Build a public profile URL.
 */
export function profileUrl(handle: string): string {
  const normalized = normalizeHandle(handle);
  return `/@${normalized}`;
}

/**
 * Build a question box URL.
 */
export function boxUrl(handle: string, slug: string): string {
  const normalized = normalizeHandle(handle);
  return `/@${normalized}/${slug}`;
}
