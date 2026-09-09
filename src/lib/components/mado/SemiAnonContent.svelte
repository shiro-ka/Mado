<script lang="ts">
  import { Shield, Lock, Eye, EyeOff, User } from "lucide-svelte";

  const visibility = [
    {
      icon: User, tone: "accent",
      title: "窓のオーナー",
      items: ["声の本文", "送り主のDIDおよびBlueskyハンドル"],
    },
    {
      icon: Eye, tone: "accent",
      title: "第三者（一般の閲覧者）",
      items: ["声の本文（オーナーが回答・公開した場合）", "送り主の情報：一切見えない"],
    },
    {
      icon: EyeOff, tone: "success",
      title: "Mado（このサービス）",
      items: ["暗号化されたDID（復号鍵なし）", "声の本文（平文）"],
    },
  ];
</script>

<div data-suisou-layout="stack container gap-4" class="page">
  <div data-suisou-layout="stack">
    <h1 data-suisou-text="s24 w700">半匿名の仕組み</h1>
    <p data-suisou-text="s16 doc" class="sub">
      Madoは<strong>完全匿名ではありません</strong>。
      声を送るにはBlueskyアカウントでのログインが必要で、あなたのDIDは暗号化された形で記録されます。
      ただしその情報は窓のオーナーだけが復号でき、第三者には一切開示されません。
    </p>
  </div>

  <!-- ★手書きの琥珀色の箱 → Suisou の banner="warning"。
       枠・下地・文字色の組は solve.py が検証済みのものに置き換わる。 -->
  <div data-suisou-banner="warning" data-suisou-media>
    <Shield data-suisou-icon="warning" data-suisou-media-icon />
    <p data-suisou-media-content data-suisou-text="s14 doc">
      声を送ると、あなたのBluesky DID（分散型識別子）がオーナーに届きます。
      オーナーはあなたのハンドル（@example.bsky.social）を確認できます。
      これを理解した上でご利用ください。
    </p>
  </div>

  <section data-suisou-layout="stack gap-3" class="group">
    <h2 data-suisou-text="s16 w700">誰が何を見られるか</h2>
    {#each visibility as row}
      <div data-suisou-surface="panel" data-suisou-media>
        <span data-suisou-tile><row.icon data-suisou-icon={row.tone} /></span>
        <div data-suisou-media-content>
          <p data-suisou-text="s14 w700">{row.title}</p>
          <!-- ★しるしはブラウザに任せる（data-suisou-list）。"•" を
               span で手書きしていて、読み上げから「箇条書き」の意味が消えていた。 -->
          <ul data-suisou-list data-suisou-text="s14" class="sub">
            {#each row.items as item}
              <li>{item}</li>
            {/each}
          </ul>
        </div>
      </div>
    {/each}
  </section>

  <section data-suisou-layout="stack gap-3" class="group">
    <h2 data-suisou-text="s16 w700">暗号化の仕組み</h2>
    <div data-suisou-surface="panel" data-suisou-media>
      <Lock data-suisou-icon="success" data-suisou-media-icon />
      <div data-suisou-media-content data-suisou-layout="stack" data-suisou-text="s14 doc">
        <p class="sub">
          送り主のDIDは<strong>ECIES（楕円曲線統合暗号化スキーム）</strong>によって暗号化されます。窓ごとに公開鍵・秘密鍵のペアが生成され、公開鍵で暗号化されたDIDは対応する秘密鍵がなければ復号できません。
        </p>
        <p class="sub">
          秘密鍵はオーナーのブラウザ内（またはMadoのサーバー上の安全なストレージ）にのみ保存されます。Madoのデータベースには暗号化済みのDIDしか存在しないため、サービス側からも送り主を特定することはできません。
        </p>
      </div>
    </div>
  </section>
</div>

<style>
  .page {
    --suisou-measure: 42rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-text-sub);
  }
  strong {
    color: var(--suisou-text-main);
  }
</style>
