<script lang="ts">
  import { Globe } from "lucide-svelte";
  import Brand from "./Brand.svelte";
</script>

<footer data-suisou="bd-top" class="foot">
  <div data-suisou-layout="stack gap-4" data-suisou="container" class="inner">
    <div data-suisou-layout="stack md:even gap-4" class="cols">
      <!-- Brand -->
      <div data-suisou-layout="stack">
        <Brand size="lg" />
        <p data-suisou-text="fs-14" class="sub">
          ATProtocol基盤の半匿名メッセージ。<br />窓越しに、想いを届けよう。
        </p>
      </div>

      <!-- Links -->
      <div data-suisou-layout="stack">
        <h4 data-suisou-text="fs-14 fw-700">リンク</h4>
        <div data-suisou-layout="stack">
          {#each [{ href: "/", label: "トップ" }, { href: "/auth/login", label: "ログイン" }, { href: "/home", label: "ホーム" }] as link}
            <a href={link.href} data-suisou-text="link fs-14" class="sub">
              {link.label}
            </a>
          {/each}
        </div>
      </div>

      <!-- Legal / Info -->
      <div data-suisou-layout="stack">
        <h4 data-suisou-text="fs-14 fw-700">情報</h4>
        <div data-suisou-layout="stack">
          {#each [{ href: "/privacy", label: "プライバシーポリシー" }, { href: "/terms", label: "利用規約" }] as link}
            <a href={link.href} data-suisou-text="link fs-14" class="sub">
              {link.label}
            </a>
          {/each}
          <a
            href="https://atproto.com"
            target="_blank"
            rel="noopener noreferrer"
            data-suisou-layout="row"
            data-suisou-text="link fs-14" class="sub"
          >
            <Globe data-suisou-text="fs-16" />
            ATProtocol
          </a>
        </div>
      </div>
    </div>

    <div data-suisou-layout="stack s:row between" data-suisou="bd-top" class="bottom">
      <p data-suisou-text="fs-12" class="sub">
        &copy; {new Date().getFullYear()} Mado. All rights reserved.
      </p>
      <div data-suisou-layout="row" data-suisou-text="fs-12" class="sub">
        <Globe data-suisou-text="fs-16" />
        <span>Powered by ATProtocol</span>
      </div>
    </div>
  </div>
</footer>

<style>
  .foot {
    width: 100%;
    margin-block-start: auto;
    background: var(--suisou-color-panel);
  }
  .inner {
    padding: var(--suisou-space-4) var(--suisou-space-3);
  }
  .bottom {
    margin-block-start: var(--suisou-space-4);
    padding-block-start: var(--suisou-space-3);
  }

  .sub {
    color: var(--suisou-color-text-sub);
  }
  .sub:hover {
    color: var(--suisou-color-text);
  }
</style>
