<script lang="ts">
  import { UserCheck, MessageCircle, Inbox, Send, Eye } from "lucide-svelte";

  const ownerSteps = [
    { step: "1", icon: UserCheck, color: "text-blue-400", title: "Blueskyでログイン", body: "右上の「ログイン」からBlueskyアカウントで認証します。OAuthを使うためパスワードは不要です。" },
    { step: "2", icon: MessageCircle, color: "text-emerald-400", title: "窓を作る", body: "ホーム → 窓 → 新しく作成。タイトルと説明を入力して公開します。URLをSNSでシェアして声を募集しましょう。" },
    { step: "3", icon: Inbox, color: "text-blue-400", title: "声を受け取る・回答する", body: "受信トレイに届いた声を確認できます。送り主のハンドルも表示されます。回答はBluesky上にそのまま投稿することもできます。" },
  ];

  const senderSteps = [
    { step: "1", icon: UserCheck, color: "text-blue-400", title: "Blueskyでログイン", body: "声を送るにもログインが必要です。これによりスパムを防ぎ、半匿名性を担保します。" },
    { step: "2", icon: Send, color: "text-emerald-400", title: "窓のURLにアクセスして送信", body: "オーナーが共有したURLを開き、声を入力して送信します。あなたのDIDは暗号化されてオーナーにのみ届きます。" },
    { step: "3", icon: Eye, color: "text-blue-400", title: "送り主はオーナーのみ確認できる", body: "送信した声の内容と送り主情報は、窓のオーナーだけが確認できます。第三者には一切見えません。" },
  ];
</script>

<div class="max-w-2xl mx-auto px-4 py-12 flex flex-col gap-10">
  <div>
    <h1 class="text-2xl font-bold mb-3 text-foreground">使い方</h1>
    <p class="text-base leading-relaxed text-muted-foreground">Madoは「窓を開くオーナー」と「声を送る訪問者」の2つの役割があります。</p>
  </div>
  {#each [{ title: "窓を開く", steps: ownerSteps }, { title: "声を送る", steps: senderSteps }] as section}
    <section class="flex flex-col gap-4">
      <h2 class="text-base font-bold text-foreground">{section.title}</h2>
      {#each section.steps as item}
        <div data-suisou-surface="panel" class="p-5 flex gap-4">
          <div class="relative shrink-0">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center mt-0.5 bg-elevated">
              <item.icon size={17} class={item.color} />
            </div>
            <div class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center font-bold bg-primary text-background" style="font-size:10px">
              {item.step}
            </div>
          </div>
          <div>
            <p class="font-bold mb-1 text-foreground">{item.title}</p>
            <p class="leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        </div>
      {/each}
    </section>
  {/each}
</div>
