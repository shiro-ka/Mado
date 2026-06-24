import type { RequestHandler } from "./$types";
import { resolveHandle, findBoxBySlug, getProfile } from "$lib/atproto";

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!
  );
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

/**
 * Fetch an avatar and inline it as a data URI. satori can't decode webp, so we
 * only accept png/jpeg; anything else (or a failure) falls back to no avatar.
 */
async function fetchImageDataUri(url?: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!/^image\/(png|jpe?g)$/.test(ct)) return null;
    const b64 = Buffer.from(new Uint8Array(await res.arrayBuffer())).toString("base64");
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
}

export const GET: RequestHandler = async ({ params, platform }) => {
  const { ImageResponse, GoogleFont, cache } = await import("@cf-wasm/og/workerd");
  const { htmlToReact } = await import("@cf-wasm/og/html-to-react");
  if (platform?.ctx) cache.setExecutionContext(platform.ctx);

  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");

  let title = "質問箱";
  let ownerName = `@${cleanHandle}`;
  let avatarUri: string | null = null;

  try {
    const did = await resolveHandle(cleanHandle);
    if (did) {
      const [box, profile] = await Promise.all([
        findBoxBySlug(did, params.slug),
        getProfile(did),
      ]);
      if (box?.title) title = box.title;
      if (profile?.displayName) ownerName = profile.displayName;
      else if (profile?.handle) ownerName = `@${profile.handle}`;
      avatarUri = await fetchImageDataUri(profile?.avatar);
    }
  } catch {
    // fall through to defaults
  }

  const displayTitle = truncate(title, 44);
  const ownerLine = `${ownerName}の窓`;
  // Every rendered glyph must be in the subset request, or it renders as tofu.
  const allText = displayTitle + ownerLine;

  const BLUE = "#4c8dff";
  const PANE = "rgba(120,170,255,0.13)";

  const avatarImg = avatarUri
    ? `<img src="${avatarUri}" width="60" height="60" style="width:60px;height:60px;border-radius:60px;margin-right:18px;object-fit:cover;border:2px solid ${BLUE};" />`
    : "";

  const element = htmlToReact(`
    <div style="display:flex;position:relative;width:100%;height:100%;background:linear-gradient(135deg,#060c18 0%,#0b1726 100%);font-family:NotoJP;">
      <div style="position:absolute;top:28px;bottom:28px;left:598px;width:4px;background:${PANE};"></div>
      <div style="position:absolute;left:28px;right:28px;top:313px;height:4px;background:${PANE};"></div>
      <div style="position:absolute;top:28px;left:28px;right:28px;bottom:28px;border:5px solid ${BLUE};border-radius:18px;"></div>
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;padding:90px 120px;">
        <div style="display:flex;flex-wrap:wrap;justify-content:center;font-size:62px;font-weight:700;line-height:1.3;color:#ffffff;text-align:center;">${escapeHtml(displayTitle)}</div>
      </div>
      <div style="position:absolute;right:64px;bottom:58px;display:flex;align-items:center;">
        ${avatarImg}
        <div style="display:flex;font-size:30px;color:#cfe2ff;">${escapeHtml(ownerLine)}</div>
      </div>
    </div>
  `);

  const fontBold = new GoogleFont("Noto Sans JP", { name: "NotoJP", weight: 700, text: allText });
  const fontReg = new GoogleFont("Noto Sans JP", { name: "NotoJP", weight: 400, text: allText });

  const res = await ImageResponse.async(element, {
    width: 1200,
    height: 630,
    format: "png",
    fonts: [fontBold, fontReg],
  });
  res.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
  return res;
};
