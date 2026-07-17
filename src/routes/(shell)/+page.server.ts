import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

// `/` is the public landing page. Logged-in users are sent to the app home.
export const load: PageServerLoad = async ({ parent }) => {
  const { session } = await parent();
  if (session) throw redirect(303, "/home");
  return {};
};
