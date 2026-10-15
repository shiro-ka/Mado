<script lang="ts">
  import { UserCheck, MessageCircle, Inbox, Send, Eye } from "lucide-svelte";

  const ownerSteps = [
    { step: "1", icon: UserCheck, tone: "accent", title: "Blueskyでログイン", body: "右上の「ログイン」からBlueskyアカウントで認証します。OAuthを使うためパスワードは不要です。" },
    { step: "2", icon: MessageCircle, tone: "success", title: "窓を作る", body: "ホーム → 窓 → 新しく作成。タイトルと説明を入力して公開します。URLをSNSでシェアして声を募集しましょう。" },
    { step: "3", icon: Inbox, tone: "accent", title: "声を受け取る・回答する", body: "受信トレイに届いた声を確認できます。送り主のハンドルも表示されます。回答はBluesky上にそのまま投稿することもできます。" },
  ];

  const senderSteps = [
    { step: "1", icon: UserCheck, tone: "accent", title: "Blueskyでログイン", body: "声を送るにもログインが必要です。これによりスパムを防ぎ、半匿名性を担保します。" },
    { step: "2", icon: Send, tone: "success", title: "窓のURLにアクセスして送信", body: "オーナーが共有したURLを開き、声を入力して送信します。あなたのDIDは暗号化されてオーナーにのみ届きます。" },
    { step: "3", icon: Eye, tone: "accent", title: "送り主はオーナーのみ確認できる", body: "送信した声の内容と送り主情報は、窓のオーナーだけが確認できます。第三者には一切見えません。" },
  ];

  const sections = [
    { title: "窓を開く", steps: ownerSteps },
    { title: "声を送る", steps: senderSteps },
  ];
</script>

<div data-suisou-layout="stack gap-4" data-suisou="container" class="page">
  <div data-suisou-layout="stack">
    <h1 data-suisou-text="fs-24 fw-700">使い方</h1>
    <p data-suisou-text="fs-16 doc" class="sub">
      Madoは「窓を開くオーナー」と「声を送る訪問者」の2つの役割があります。
    </p>
  </div>

  {#each sections as section}
    <section data-suisou-layout="stack gap-3" class="group">
      <h2 data-suisou-text="fs-16 fw-700">{section.title}</h2>
      {#each section.steps as item}
        <div data-suisou-tray data-suisou-item="media">
          <span class="step">
            <span data-suisou-item="square"><item.icon data-suisou-icon={item.tone} /></span>
            <span data-suisou-text="fs-12 fw-700" class="num">{item.step}</span>
          </span>
          <div data-suisou-item="media-content">
            <p data-suisou-text="fs-14 fw-700">{item.title}</p>
            <p data-suisou-text="fs-14 doc" class="sub">{item.body}</p>
          </div>
        </div>
      {/each}
    </section>
  {/each}
</div>

<style>
  .page {
    --suisou-measure: 42rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-color-text-sub);
  }

  /* 手順の番号。タイルの角に小さく載せる */
  .step {
    position: relative;
    flex: none;
  }
  .num {
    position: absolute;
    top: -0.375rem;
    inset-inline-end: -0.375rem;
    display: grid;
    place-items: center;
    width: 1.125rem;
    height: 1.125rem;
    border-radius: var(--suisou-radius-pill);
    background: var(--suisou-color-bg);
    border: 1px solid var(--suisou-color-accent);
    color: var(--suisou-color-accent);
  }
</style>
