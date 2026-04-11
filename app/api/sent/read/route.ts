import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getRedis, Keys } from "@/lib/redis";

const schema = z.object({
  ownerDid: z.string().min(1),
  koeRkey: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const raw = await request.json() as unknown;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { ownerDid, koeRkey } = parsed.data;
    const redis = getRedis();
    await redis.sadd(Keys.sentRead(session.did), `${ownerDid}:${koeRkey}`);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
