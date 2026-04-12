import { Eye, Lock, Globe, MessageCircle } from "lucide-react";

export function AboutContent() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-10">
      {/* Lead */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent">
            <MessageCircle size={20} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary">Madoについて</h1>
        </div>
        <p className="text-base leading-relaxed text-muted">
          Mado（窓）は、Blueskyアカウントを使った<strong className="text-primary">半匿名の質問箱サービス</strong>です。
          質問を送るにはBlueskyへのログインが必要なため完全匿名ではありませんが、
          送り主の情報は暗号化されてボックスオーナーにのみ届きます。
        </p>
      </div>

      {/* Features */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-primary">3つの特徴</h2>
        {[
          {
            icon: Eye,
            color: "text-blue-400",
            bg: "bg-blue-600/12",
            title: "半匿名性",
            body: "送り主はボックスオーナーにのみ開示されます。第三者が質問と送信者の紐付けを知る手段はありません。",
          },
          {
            icon: Lock,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            title: "暗号化保護",
            body: "送り主のDIDはECIES（楕円曲線統合暗号化スキーム）でボックスの公開鍵により暗号化されます。秘密鍵を持つオーナーだけが復号できます。",
          },
          {
            icon: Globe,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            title: "ATProtocol基盤",
            body: "質問・回答データはあなたのBluesky PDS（Personal Data Server）に保存されます。Mado独自のデータベースには頼らず、オープンな分散型プロトコルで動作します。",
          },
        ].map((feat) => (
          <div
            key={feat.title}
            className="rounded-xl p-5 flex gap-4 bg-surface border border-border"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${feat.bg}`}>
              <feat.icon size={18} className={feat.color} />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1 text-primary">{feat.title}</p>
              <p className="text-sm leading-relaxed text-muted">{feat.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Version note */}
      <p className="text-xs text-subtle">
        Mado はオープンベータです。仕様は予告なく変更される場合があります。
      </p>
    </div>
  );
}
