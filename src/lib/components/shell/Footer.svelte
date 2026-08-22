<script lang="ts">
  import { Globe } from "lucide-svelte";
  import Brand from "./Brand.svelte";
</script>

<footer class="foot">
  <div class="mx-auto max-w-6xl px-4 py-10">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Brand -->
      <div data-suisou-layout="stack">
        <Brand size="lg" />
        <p class="text-muted-foreground">
          ATProtocol基盤の半匿名メッセージ。<br />窓越しに、想いを届けよう。
        </p>
      </div>

      <!-- Links -->
      <div data-suisou-layout="stack">
        <h4 data-suisou-text="s14 w700">リンク</h4>
        <div data-suisou-layout="stack">
          {#each [{ href: "/", label: "トップ" }, { href: "/auth/login", label: "ログイン" }, { href: "/home", label: "ホーム" }] as link}
            <a href={link.href} data-suisou-link class="text-muted-foreground">
              {link.label}
            </a>
          {/each}
        </div>
      </div>

      <!-- Legal / Info -->
      <div data-suisou-layout="stack">
        <h4 data-suisou-text="s14 w700">情報</h4>
        <div data-suisou-layout="stack">
          {#each [{ href: "/privacy", label: "プライバシーポリシー" }, { href: "/terms", label: "利用規約" }] as link}
            <a href={link.href} data-suisou-link class="text-muted-foreground">
              {link.label}
            </a>
          {/each}
          <a
            href="https://atproto.com"
            target="_blank"
            rel="noopener noreferrer"
            data-suisou-link class="inline-flex items-center gap-1.5 text-muted-foreground"
          >
            <Globe size={12} />
            ATProtocol
          </a>
        </div>
      </div>
    </div>

    <div data-suisou-layout="stack between" class="mt-8 pt-6 sm:flex-row rule">
      <p data-suisou-text="s12" class="text-subtle">
        &copy; {new Date().getFullYear()} Mado. All rights reserved.
      </p>
      <div data-suisou-layout="row" data-suisou-text="s12" class="text-subtle">
        <Globe size={12} class="opacity-60" />
        <span>Powered by ATProtocol</span>
      </div>
    </div>
  </div>
</footer>

<style>
  .foot {
    width: 100%;
    margin-block-start: auto;
    background: var(--suisou-panel);
    border-block-start: 1px solid var(--suisou-line-weak);
  }
  .rule {
    border-block-start: 1px solid var(--suisou-line-weak);
  }
</style>
