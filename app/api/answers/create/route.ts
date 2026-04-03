import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { writeAnswer, createBskyPost, NSID } from "@/lib/atproto";
import { restoreOAuthSession } from "@/lib/oauth";

const createAnswerSchema = z.object({
  koeUri: z.string().min(1), // AT-URI of the question: at://ownerDid/blue.mado.koe/rkey
  body: z.string().min(1).max(1000),
  crosspost: z.boolean().optional().default(false),
});

/**
 * POST /api/answers/create
 *
 * Creates a blue.mado.answer record on the owner's PDS.
 * Only the box owner (session user) can answer their own questions.
 *
 * Validates that the koeUri belongs to the logged-in user's repo before writing.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", message: "ログインが必要です" },
        { status: 401 }
      );
    }

    const raw = await request.json() as unknown;
    const parsed = createAnswerSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", message: "入力内容を確認してください" },
        { status: 400 }
      );
    }

    const { koeUri, body, crosspost } = parsed.data;

    // Security: verify the koeUri belongs to the logged-in user's repo.
    // Format: at://<ownerDid>/blue.mado.koe/<rkey>
    const expectedPrefix = `at://${session.did}/${NSID.KOE}/`;
    if (!koeUri.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: "Forbidden", message: "この質問に回答する権限がありません" },
        { status: 403 }
      );
    }

    // Restore the OAuth session for the owner
    const sessionFetch = await restoreOAuthSession(session.did);
    if (!sessionFetch) {
      return NextResponse.json(
        {
          error: "Session expired",
          message: "セッションが期限切れです。再ログインしてください。",
        },
        { status: 401 }
      );
    }

    const result = await writeAnswer({
      sessionFetch,
      ownerDid: session.did,
      koeUri,
      body,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Write failed", message: "回答の投稿に失敗しました" },
        { status: 500 }
      );
    }

    // Crosspost to Bluesky feed if requested (non-fatal if it fails)
    if (crosspost) {
      await createBskyPost({ sessionFetch, ownerDid: session.did, text: body });
    }

    return NextResponse.json({ success: true, uri: result.uri });
  } catch (err) {
    console.error("[/api/answers/create]", err);
    return NextResponse.json(
      { error: "Internal server error", message: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
