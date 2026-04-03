import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getRedis, Keys } from "@/lib/redis";
import { getBoxRecord, updateBoxRecord, deleteRecord, NSID } from "@/lib/atproto";
import { restoreOAuthSession } from "@/lib/oauth";

const updateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional(),
  isOpen: z.boolean().optional(),
});

interface Params {
  params: Promise<{ rkey: string }>;
}

/**
 * GET /api/boxes/[rkey]
 * Fetch a single box record (authenticated owner only).
 */
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rkey } = await params;
    const box = await getBoxRecord(session.did, rkey);

    if (!box) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(box);
  } catch (err) {
    console.error("[GET /api/boxes/[rkey]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/boxes/[rkey]
 * Update a box record.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionFetch = await restoreOAuthSession(session.did);
    if (!sessionFetch) {
      return NextResponse.json(
        { error: "Session expired", message: "再ログインが必要です" },
        { status: 401 }
      );
    }

    const { rkey } = await params;
    const box = await getBoxRecord(session.did, rkey);
    if (!box) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json() as unknown;
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { title, description, isOpen } = parsed.data;

    const success = await updateBoxRecord({
      sessionFetch,
      did: session.did,
      rkey,
      title: title ?? box.title,
      description: description ?? box.description,
      isOpen: isOpen ?? box.isOpen,
      publicKeyHex: box.publicKeyHex,
      slug: box.slug,
      createdAt: box.createdAt,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Update failed", message: "更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/boxes/[rkey]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/boxes/[rkey]
 * Delete a box record and its stored private key.
 */
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionFetch = await restoreOAuthSession(session.did);
    if (!sessionFetch) {
      return NextResponse.json(
        { error: "Session expired", message: "再ログインが必要です" },
        { status: 401 }
      );
    }

    const { rkey } = await params;

    const success = await deleteRecord({
      sessionFetch,
      did: session.did,
      collection: NSID.BOX,
      rkey,
    });

    if (!success) {
      return NextResponse.json(
        { error: "Delete failed", message: "削除に失敗しました" },
        { status: 500 }
      );
    }

    // Remove the private key from Redis
    const redis = getRedis();
    await redis.del(Keys.keyPair(session.did, rkey));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/boxes/[rkey]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
