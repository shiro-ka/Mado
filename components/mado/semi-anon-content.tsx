import { Shield, Lock, Eye, EyeOff, User } from "lucide-react";

export function SemiAnonContent() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold mb-3 text-primary">半匿名の仕組み</h1>
        <p className="text-base leading-relaxed text-muted">
          Madoは<strong className="text-primary">完全匿名ではありません</strong>。
          質問を送るにはBlueskyアカウントでのログインが必要で、あなたのDIDは暗号化された形で記録されます。
          ただしその情報はボックスオーナーだけが復号でき、第三者には一切開示されません。
        </p>
      </div>

      {/* Warning card */}
      <div className="rounded-xl p-5 flex gap-4 bg-amber-400/7 border border-amber-400/25">
        <Shield size={18} className="shrink-0 mt-0.5 text-amber-400" />
        <p className="text-sm leading-relaxed text-muted">
          質問を送ると、あなたのBluesky DID（分散型識別子）がオーナーに届きます。
          オーナーはあなたのハンドル（@example.bsky.social）を確認できます。
          これを理解した上でご利用ください。
        </p>
      </div>

      {/* Who can see what */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-primary">誰が何を見られるか</h2>
        {[
          {
            icon: User,
            color: "text-blue-400",
            bg: "bg-blue-600/12",
            title: "ボックスオーナー",
            items: ["質問の本文", "送り主のDIDおよびBlueskyハンドル"],
            itemColor: "text-blue-400",
          },
          {
            icon: Eye,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            title: "第三者（一般の閲覧者）",
            items: [
              "質問の本文（オーナーが回答・公開した場合）",
              "送り主の情報：一切見えない",
            ],
            itemColor: "text-blue-400",
          },
          {
            icon: EyeOff,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            title: "Mado（このサービス）",
            items: ["暗号化されたDID（復号鍵なし）", "質問の本文（平文）"],
            itemColor: "text-emerald-400",
          },
        ].map((row) => (
          <div
            key={row.title}
            className="rounded-xl p-5 flex gap-4 bg-surface border border-border"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${row.bg}`}>
              <row.icon size={17} className={row.color} />
            </div>
            <div>
              <p className="font-semibold text-sm mb-1.5 text-primary">{row.title}</p>
              <ul className="flex flex-col gap-1">
                {row.items.map((item) => (
                  <li key={item} className="text-sm flex gap-2 text-muted">
                    <span className={row.itemColor}>•</span>
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
        <h2 className="text-base font-semibold text-primary">暗号化の仕組み</h2>
        <div className="rounded-xl p-5 flex gap-4 bg-surface border border-border">
          <Lock size={18} className="shrink-0 mt-0.5 text-emerald-400" />
          <div className="text-sm leading-relaxed flex flex-col gap-2 text-muted">
            <p>
              送り主のDIDは<strong className="text-primary">ECIES（楕円曲線統合暗号化スキーム）</strong>によって暗号化されます。
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
