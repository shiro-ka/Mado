import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ fetch, url }) => {
  const res = await fetch(new URL("/og-default.png", url.origin));
  return new Response(res.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
};
