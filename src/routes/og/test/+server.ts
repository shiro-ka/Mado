import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ platform, url }) => {
  const { ImageResponse, GoogleFont, cache } = await import("@cf-wasm/og/workerd");
  const { htmlToReact } = await import("@cf-wasm/og/html-to-react");
  if (platform?.context) cache.setExecutionContext(platform.context);

  const text = url.searchParams.get("q") ?? "こんにちは、窓へようこそ。匿名の質問が届きました。";

  const element = htmlToReact(`
    <div style="display:flex;flex-direction:column;width:100%;height:100%;align-items:center;justify-content:center;background:linear-gradient(135deg,#060c18 0%,#0b1726 100%);color:#deeeff;font-family:NotoJP;padding:60px;">
      <div style="display:flex;font-size:48px;text-align:center;line-height:1.4;font-weight:700;">${text}</div>
      <div style="display:flex;font-size:22px;color:#7aaac8;margin-top:32px;">半匿名質問箱 Mado (窓)</div>
    </div>
  `);

  const fontBold = new GoogleFont("Noto Sans JP", { name: "NotoJP", weight: 700, text });
  const fontReg = new GoogleFont("Noto Sans JP", { name: "NotoJP", weight: 400, text });

  const t0 = Date.now();
  const res = await ImageResponse.async(element, {
    width: 1200,
    height: 630,
    format: "png",
    fonts: [fontBold, fontReg],
  });
  const elapsed = Date.now() - t0;
  res.headers.set("X-Render-Time", `${elapsed}ms`);
  return res;
};
