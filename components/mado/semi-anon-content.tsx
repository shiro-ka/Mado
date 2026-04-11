import { Shield, Lock, Eye, EyeOff, User } from "lucide-react";

export function SemiAnonContent() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          半匿名の仕組み
        </h1>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Madoは<strong style={{ color: "var(--text-primary)" }}>完全匿名ではありません</strong>。
          質問を送るにはBlueskyアカウントでのログインが必要で、あなたのDIDは暗号化された形で記録されます。
          ただしその情報はボックスオーナーだけが復号でき、第三者には一切開示されません。
        </p>
      </div>

      {/* Warning card */}
      <div
        className="rounded-xl p-5 flex gap-4"
        style={{
          background: "rgba(251, 191, 36, 0.07)",
          border: "1px solid rgba(251, 191, 36, 0.25)",
        }}
      >
        <Shield className="shrink-0 mt-0.5" style={{ width: 18, height: 18, color: "#fbbf24" }} />
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          質問を送ると、あなたのBluesky DID（分散型識別子）がオーナーに届きます。
          オーナーはあなたのハンドル（@example.bsky.social）を確認できます。
          これを理解した上でご利用ください。
        </p>
      </div>

      {/* Who can see what */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          誰が何を見られるか
        </h2>
        {[
          {
            icon: User,
            color: "#a78bfa",
            bg: "rgba(124, 58, 237, 0.12)",
            title: "ボックスオーナー",
            items: [
              "質問の本文",
              "送り主のDIDおよびBlueskyハンドル",
            ],
          },
          {
            icon: Eye,
            color: "#60a5fa",
            bg: "rgba(96, 165, 250, 0.1)",
            title: "第三者（一般の閲覧者）",
            items: [
              "質問の本文（オーナーが回答・公開した場合）",
              "送り主の情報：一切見えない",
            ],
          },
          {
            icon: EyeOff,
            color: "#34d399",
            bg: "rgba(52, 211, 153, 0.1)",
            title: "Mado（このサービス）",
            items: [
              "暗号化されたDID（復号鍵なし）",
              "質問の本文（平文）",
            ],
          },
        ].map((row) => (
          <div
            key={row.title}
            className="rounded-xl p-5 flex gap-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: row.bg }}
            >
              <row.icon style={{ width: 17, height: 17, color: row.color }} />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1.5" style={{ color: "var(--text-primary)" }}>
                {row.title}
              </p>
              <ul className="flex flex-col gap-1">
                {row.items.map((item) => (
                  <li key={item} className="text-sm flex gap-2" style={{ color: "var(--text-muted)" }}>
                    <span style={{ color: row.color }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </section>

      {/* Encryption */}
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          暗号化の仕組み
        </h2>
        <div
          className="rounded-xl p-5 flex gap-4"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <Lock className="shrink-0 mt-0.5" style={{ width: 18, height: 18, color: "#34d399" }} />
          <div className="text-sm leading-relaxed flex flex-col gap-2" style={{ color: "var(--text-muted)" }}>
            <p>
              送り主のDIDは<strong style={{ color: "var(--text-primary)" }}>ECIES（楕円曲線統合暗号化スキーム）</strong>によって暗号化されます。
              質問箱ごとに公開鍵・秘密鍵のペアが生成され、公開鍵で暗号化されたDIDは対応する秘密鍵がなければ復号できません。
            </p>
            <p>
              秘密鍵はオーナーのブラウザ内（またはMadoのサーバー上の安全なストレージ）にのみ保存されます。
              Madoのデータベースには暗号化済みのDIDしか存在しないため、サービス側からも送り主を特定することはできません。
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
