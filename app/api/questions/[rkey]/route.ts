import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getRedis, Keys } from "@/lib/redis";
import { deleteRecord } from "@/lib/atproto";
import { restoreOAuthSession } from "@/lib/oauth";

interface Params {
  params: Promise<{ rkey: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireSession();
  const { rkey } = await params;

  const sessionFetch = await restoreOAuthSession(session.did);
  if (!sessionFetch) {
    return NextResponse.json({ error: "oauth session not found" }, { status: 401 });
  }

  const ok = await deleteRecord({
    sessionFetch,
    did: session.did,
    collection: "blue.mado.koe",
    rkey,
  });

  if (!ok) {
    return NextResponse.json({ error: "failed to delete record" }, { status: 500 });
  }

  // Remove from read set
  const redis = getRedis();
  await redis.srem(Keys.read(session.did), rkey);

  return NextResponse.json({ ok: true });
}
