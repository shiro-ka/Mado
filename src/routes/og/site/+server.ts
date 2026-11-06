import type { RequestHandler } from "./$types";
import { CATCHPHRASE } from "$lib/brand.js";
import { defaultTheme, renderOg, siteCardHtml } from "$lib/og";

export const GET: RequestHandler = async ({ platform }) =>
  renderOg(siteCardHtml(defaultTheme), "Mado" + CATCHPHRASE, platform?.ctx);
