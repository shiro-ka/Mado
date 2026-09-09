/* $lib/atproto の入口。
   中は3つに分かれている ―― 変わる理由が別々だから:
     client.ts   繋ぎ先・読み出しのキャッシュ・素性の解決（誰がどの PDS に居るか）
     records.ts  blue.mado.box / koe / answer の読み書き
     bsky.ts     app.bsky.* への働きかけ（フォロー・投稿）
   現場はこの1本だけを見ればよい。 */
export { invalidateRecords, getProfile, resolveHandle, getPdsUrl, deleteRecord } from "./client.js";
export {
  NSID,
  getBoxRecord,
  listBoxes,
  findBoxBySlug,
  getKoeRecord,
  listQuestions,
  getAnswersByOwner,
  listAnswers,
  writeQuestion,
  writeAnswer,
  createBoxRecord,
  updateBoxRecord,
} from "./records.js";
export { getViewerFollowsActor, writeFollow, createBskyPost } from "./bsky.js";
