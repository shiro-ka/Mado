import { Eye, Lock, Globe, MessageCircle } from "lucide-react";

export function AboutContent() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-10">
      {/* Lead */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--accent)" }}
          >
            <MessageCircle className="text-white" style={{ width: 20, height: 20 }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Madoについて
          </h1>
        </div>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Mado（窓）は、Blueskyアカウントを使った<strong style={{ color: "var(--text-primary)" }}>半匿名の質問箱サービス</strong>です。
          質問を送るにはBlueskyへのログインが必要なため完全匿名ではありませんが、
          送り主の情報は暗号化されてボックスオーナーにのみ届きます。
        </p>
      </div>

      {/* Features */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          3つの特徴
        </h2>
        {[
          {
            icon: Eye,
            color: "#a78bfa",
            bg: "rgba(124, 58, 237, 0.12)",
            title: "半匿名性",
            body: "送り主はボックスオーナーにのみ開示されます。第三者が質問と送信者の紐付けを知る手段はありません。",
          },
          {
            icon: Lock,
            color: "#34d399",
            bg: "rgba(52, 211, 153, 0.1)",
            title: "暗号化保護",
            body: "送り主のDIDはECIES（楕円曲線統合暗号化スキーム）でボックスの公開鍵により暗号化されます。秘密鍵を持つオーナーだけが復号できます。",
          },
          {
            icon: Globe,
            color: "#60a5fa",
            bg: "rgba(96, 165, 250, 0.1)",
            title: "ATProtocol基盤",
            body: "質問・回答データはあなたのBluesky PDS（Personal Data Server）に保存されます。Mado独自のデータベースには頼らず、オープンな分散型プロトコルで動作します。",
          },
        ].map((feat) => (
          <div
            key={feat.title}
            className="rounded-xl p-5 flex gap-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: feat.bg }}
            >
              <feat.icon style={{ width: 18, height: 18, color: feat.color }} />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                {feat.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {feat.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Version note */}
      <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
        Mado はオープンベータです。仕様は予告なく変更される場合があります。
      </p>
    </div>
  );
}
