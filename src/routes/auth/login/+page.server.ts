import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { safeNext } from "$lib/loginNext.js";

export const load: PageServerLoad = ({ url }) => {
  const next = safeNext(url.searchParams.get("next"));
  throw redirect(301, next ? `/?next=${encodeURIComponent(next)}` : "/");
};
