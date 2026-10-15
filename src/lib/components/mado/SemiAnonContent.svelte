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

<div data-suisou-layout="stack gap-4" data-suisou="container" class="page">
  <div data-suisou-layout="stack">
    <h1 data-suisou-text="fs-24 fw-700">半匿名の仕組み</h1>
    <p data-suisou-text="fs-16" class="sub doc">
      Madoは<strong>完全匿名ではありません</strong>。
      声を送るにはBlueskyアカウントでのログインが必要で、あなたのDIDは暗号化された形で記録されます。
      ただしその情報は窓のオーナーだけが復号でき、第三者には一切開示されません。
    </p>
  </div>

  <!-- ★手書きの琥珀色の箱 → Suisou の banner="warning"。
       枠・下地・文字色の組は solve.py が検証済みのものに置き換わる。 -->
  <div data-suisou-item="notice media" data-suisou="warning">
    <Shield data-suisou-item="media-figure" data-suisou-text="fs-20" data-suisou="warning" />
    <p data-suisou-item="media-content" data-suisou-text="fs-14" class="doc">
      声を送ると、あなたのBluesky DID（分散型識別子）がオーナーに届きます。
      オーナーはあなたのハンドル（@example.bsky.social）を確認できます。
      これを理解した上でご利用ください。
    </p>
  </div>

  <section data-suisou-layout="stack gap-3" class="group">
    <h2 data-suisou-text="fs-16 fw-700">誰が何を見られるか</h2>
    {#each visibility as row}
      <div data-suisou-tray data-suisou-item="media">
        <span data-suisou-item="square"><row.icon data-suisou-text="fs-20" data-suisou={row.tone} /></span>
        <div data-suisou-item="media-content">
          <p data-suisou-text="fs-14 fw-700">{row.title}</p>
          <!-- ★しるしはブラウザに任せる（data-suisou-list）。"•" を
               span で手書きしていて、読み上げから「箇条書き」の意味が消えていた。 -->
          <ul data-suisou-text="fs-14" class="sub list">
            {#each row.items as item}
              <li>{item}</li>
            {/each}
          </ul>
        </div>
      </div>
    {/each}
  </section>

  <section data-suisou-layout="stack gap-3" class="group">
    <h2 data-suisou-text="fs-16 fw-700">暗号化の仕組み</h2>
    <div data-suisou-tray data-suisou-item="media">
      <Lock data-suisou-item="media-figure" data-suisou-text="fs-20" data-suisou="success" />
      <div data-suisou-item="media-content" data-suisou-layout="stack" data-suisou-text="fs-14" class="doc">
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
    max-width: 42rem;
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .sub {
    color: var(--suisou-color-text-sub);
  }
  .list {
    padding-inline-start: var(--suisou-space-4);
  }
  .list li + li {
    margin-block-start: var(--suisou-space-1);
  }
  .list ::marker {
    color: var(--suisou-color-text-sub);
  }
  strong {
    color: var(--suisou-color-text);
  }
</style>
