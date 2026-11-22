async function call<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("通信できませんでした");
  }
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) throw new Error(data.message ?? "うまくいきませんでした");
  return data;
}

export function markHeard(rkey: string) {
  return call(`/api/questions/${rkey}/handled`, "POST");
}

export function markUnheard(rkey: string) {
  return call(`/api/questions/${rkey}/handled`, "DELETE");
}

export function deleteKoe(rkey: string) {
  return call(`/api/questions/${rkey}`, "DELETE");
}

export function blockSender(senderDid: string) {
  return call("/api/blocks/create", "POST", { senderDid });
}

export function unblockSender(senderDid: string) {
  return call("/api/blocks/remove", "DELETE", { senderDid });
}

export function sendKoe(boxOwnerDid: string, boxRkey: string, body: string) {
  return call("/api/questions/send", "POST", { body, boxOwnerDid, boxRkey });
}

export function postAnswer(koeUri: string, body: string, crosspost: boolean) {
  return call<{ uri: string; crossposted: boolean; crosspostUri: string | null }>("/api/answers/create", "POST", {
    koeUri,
    body,
    crosspost,
  });
}

export type BoxFields = { title: string; description?: string; slug?: string };

export function createBox(fields: BoxFields) {
  return call<{ rkey: string; uri: string; slug: string }>("/api/boxes/create", "POST", fields);
}

export function updateBox(rkey: string, fields: BoxFields & { isOpen: boolean }) {
  return call(`/api/boxes/${rkey}`, "PATCH", fields);
}

export function deleteBox(rkey: string) {
  return call(`/api/boxes/${rkey}`, "DELETE");
}

export function setMainBox(rkey: string, main: boolean) {
  return call(`/api/boxes/${rkey}/main`, main ? "POST" : "DELETE");
}

export function saveCardStyle(colors: Record<string, string>) {
  return call<{ updatedAt: string }>("/api/card-style", "POST", colors);
}

export function followOfficial() {
  return call<{ following: boolean }>("/api/notifications/follow", "POST");
}

export function saveNotificationPrefs(dmEnabled: boolean) {
  return call<{ dmEnabled: boolean }>("/api/notifications/prefs", "POST", { dmEnabled });
}

export function startLogin(params: { next?: string; addAccount?: boolean; handle?: string }) {
  return call<{ redirectUrl?: string }>("/api/auth/login", "POST", params);
}
