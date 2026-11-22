import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
  ref?: E | null;
};

import { ja } from "date-fns/locale";

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

export function formatDateFull(dateString: string): string {
  const date = new Date(dateString);
  return format(date, "yyyy年M月d日 HH:mm", { locale: ja });
}

/**
 * Convert an app.bsky.feed.post AT-URI (at://did/app.bsky.feed.post/rkey) into a
 * clickable bsky.app permalink. Returns null if the URI isn't a post URI.
 */
export function bskyPostUrl(atUri: string): string | null {
  const m = atUri.match(/^at:\/\/([^/]+)\/app\.bsky\.feed\.post\/([^/]+)$/);
  if (!m) return null;
  return `https://bsky.app/profile/${m[1]}/post/${m[2]}`;
}
