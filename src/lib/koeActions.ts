async function call<T = Record<string, unknown>>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
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

export function postAnswer(koeUri: string, body: string, crosspost: boolean) {
  return call<{ uri: string; crossposted: boolean; crosspostUri: string | null }>("/api/answers/create", "POST", {
    koeUri,
    body,
    crosspost,
  });
}
