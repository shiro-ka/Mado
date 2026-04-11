import { UserCheck, MessageCircle, Inbox, Send, Eye } from "lucide-react";

export function GuideContent() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          使い方
        </h1>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Madoは「質問箱を開設するオーナー」と「質問を送る訪問者」の2つの役割があります。
        </p>
      </div>

      {/* For owners */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          質問箱を開設する
        </h2>
        {[
          {
            step: "1",
            icon: UserCheck,
            color: "#a78bfa",
            title: "Blueskyでログイン",
            body: "右上の「ログイン」からBlueskyアカウントで認証します。OAuthを使うためパスワードは不要です。",
          },
          {
            step: "2",
            icon: MessageCircle,
            color: "#34d399",
            title: "質問箱を作成",
            body: "ダッシュボード → 質問箱 → 新しく作成。タイトルと説明を入力して公開します。URLをSNSでシェアして質問を募集しましょう。",
          },
          {
            step: "3",
            icon: Inbox,
            color: "#60a5fa",
            title: "質問を受け取る・回答する",
            body: "受信トレイに届いた質問を確認できます。送り主のハンドルも表示されます。回答はBluesky上にそのまま投稿することもできます。",
          },
        ].map((item) => (
          <div
            key={item.step}
            className="rounded-xl p-5 flex gap-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div className="relative shrink-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                style={{ background: "var(--bg-elevated)" }}
              >
                <item.icon style={{ width: 17, height: 17, color: item.color }} />
              </div>
              <div
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--accent)", color: "white", fontSize: 10 }}
              >
                {item.step}
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                {item.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* For senders */}
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          質問を送る
        </h2>
        {[
          {
            step: "1",
            icon: UserCheck,
            color: "#a78bfa",
            title: "Blueskyでログイン",
            body: "質問を送るにもログインが必要です。これによりスパムを防ぎ、半匿名性を担保します。",
          },
          {
            step: "2",
            icon: Send,
            color: "#34d399",
            title: "質問箱のURLにアクセスして送信",
            body: "オーナーが共有したURLを開き、質問を入力して送信します。あなたのDIDは暗号化されてオーナーにのみ届きます。",
          },
          {
            step: "3",
            icon: Eye,
            color: "#60a5fa",
            title: "送り主はオーナーのみ確認できる",
            body: "送信した質問の内容と送り主情報は、ボックスオーナーだけが確認できます。第三者には一切見えません。",
          },
        ].map((item) => (
          <div
            key={item.step}
            className="rounded-xl p-5 flex gap-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <div className="relative shrink-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mt-0.5"
                style={{ background: "var(--bg-elevated)" }}
              >
                <item.icon style={{ width: 17, height: 17, color: item.color }} />
              </div>
              <div
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--accent)", color: "white", fontSize: 10 }}
              >
                {item.step}
              </div>
            </div>
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                {item.title}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
