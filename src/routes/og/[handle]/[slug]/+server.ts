import type { RequestHandler } from "./$types";
import { resolveHandle, findBoxBySlug, getProfile } from "$lib/atproto";
import {
  resolveTheme,
  escapeHtml,
  truncate,
  fetchImageDataUri,
  logoImg,
  profile,
  BRAND_DESC,
  type Theme,
} from "$lib/og";

/** 窓OG = 案D「フレーム×パネル」。左パネル=ロゴ＋ブランド、右=タイトル、右下=プロフィール。 */
function render(
  t: Theme,
  data: { title: string; name: string; handle: string; avatarUri: string | null }
): string {
  const logo = logoImg(t.accent, 94);
  const prof = profile(t, data.name, "のMado", data.handle, data.avatarUri);
  return (
    `<div style="display:flex;width:100%;height:100%;background:${t.bg};position:relative;font-family:'ZenMaru';">` +
    // 窓枠
    `<div style="position:absolute;top:30px;left:30px;right:30px;bottom:30px;border:3px solid ${t.frameBorder};border-radius:20px;"></div>` +
    // 枠の内側: 左パネル + 右メイン
    `<div style="position:absolute;top:34px;left:34px;right:34px;bottom:34px;display:flex;overflow:hidden;border-radius:16px;">` +
    `<div style="display:flex;flex-direction:column;justify-content:space-between;width:360px;background:${t.pane};padding:62px 48px;">` +
    `<div style="display:flex;">${logo}</div>` +
    `<div style="display:flex;flex-direction:column;gap:10px;">` +
    `<span style="font-size:40px;font-weight:700;letter-spacing:-0.02em;color:${t.ink};">Mado</span>` +
    `<span style="font-size:23px;color:${t.sub};">${BRAND_DESC}</span>` +
    `</div>` +
    `</div>` +
    `<div style="display:flex;flex-direction:column;justify-content:center;flex:1;padding:70px 62px 120px;">` +
    `<div style="display:flex;flex-wrap:wrap;font-size:60px;line-height:1.3;font-weight:700;letter-spacing:-0.01em;color:${t.ink};">${escapeHtml(data.title)}</div>` +
    `</div>` +
    `</div>` +
    // 右下プロフィール
    `<div style="position:absolute;right:74px;bottom:66px;display:flex;">${prof}</div>` +
    `</div>`
  );
}

export const GET: RequestHandler = async ({ params, url, platform }) => {
  const { ImageResponse, GoogleFont, cache } = await import("@cf-wasm/og/workerd");
  const { htmlToReact } = await import("@cf-wasm/og/html-to-react");
  if (platform?.ctx) cache.setExecutionContext(platform.ctx);

  const cleanHandle = decodeURIComponent(params.handle).replace(/^@/, "");
  const { t } = resolveTheme(url.searchParams);

  let title = "質問箱";
  let name = cleanHandle;
  let handle = cleanHandle;
  let avatarUri: string | null = null;

  try {
    const did = await resolveHandle(cleanHandle);
    if (did) {
      const [box, prof] = await Promise.all([findBoxBySlug(did, params.slug), getProfile(did)]);
      if (box?.title) title = box.title;
      if (prof?.handle) handle = prof.handle;
      name = prof?.displayName || prof?.handle || cleanHandle;
      avatarUri = await fetchImageDataUri(prof?.avatar);
    }
  } catch {
    // fall through to defaults
  }

  const displayTitle = truncate(title, 44);
  const element = htmlToReact(render(t, { title: displayTitle, name, handle, avatarUri }));

  // 描画されるグリフを全部サブセット要求に含める（欠けると豆腐になる）
  const allText = displayTitle + name + "のMado" + "@" + handle + "Mado" + BRAND_DESC;
  // Web と揃える: Zen Maru Gothic。混在サブセットは1ウェイト=1フォントにし、
  // 描画側で font-family:'ZenMaru' を指定して weight を正しくマッチさせる。
  const F = (weight: 400 | 500 | 700) =>
    new GoogleFont("Zen Maru Gothic", { name: "ZenMaru", weight, text: allText });
  const fonts = [F(400), F(500), F(700)];

  const res = await ImageResponse.async(element, { width: 1200, height: 630, format: "png", fonts });
  res.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
  return res;
};
